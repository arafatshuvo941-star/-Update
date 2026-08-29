import { Product, Sale, SaleItem, Customer, Payment, Expense, StoreSettings } from '../types';
import { isItemDeleted } from '../utils/tombstones';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export interface SyncResult {
  success: boolean;
  message: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  isAuthRequired?: boolean;
}

export class GoogleSheetsService {
  private static token: string | null = null;
  private static tokenExpiry: number = 0;
  private static hasSheetsScope: boolean = false;
  private static authInProgressPromise: Promise<string> | null = null;

  public static setToken(token: string, expiresInSeconds: number = 3600, hasSheetsScope: boolean = true) {
    this.token = token;
    this.hasSheetsScope = hasSheetsScope;
    // Set expiry with a 3-minute safety buffer
    this.tokenExpiry = Date.now() + Math.max(60, expiresInSeconds - 180) * 1000;
    try {
      localStorage.setItem('gsheets_access_token', token);
      localStorage.setItem('gsheets_token_expiry', this.tokenExpiry.toString());
      localStorage.setItem('gsheets_has_scope', hasSheetsScope ? 'true' : 'false');
    } catch {
      // Ignore storage errors in restricted iframe/private mode
    }
  }

  public static getToken(): string | null {
    if (this.token && Date.now() < this.tokenExpiry && this.hasSheetsScope) {
      return this.token;
    }
    const storedToken = localStorage.getItem('gsheets_access_token');
    const storedExpiry = Number(localStorage.getItem('gsheets_token_expiry') || '0');
    const storedHasScope = localStorage.getItem('gsheets_has_scope') === 'true';

    if (storedToken && Date.now() < storedExpiry && storedHasScope) {
      this.token = storedToken;
      this.tokenExpiry = storedExpiry;
      this.hasSheetsScope = true;
      return storedToken;
    }
    return null;
  }

  public static isConnected(): boolean {
    return !!this.getToken();
  }

  public static disconnect() {
    this.token = null;
    this.tokenExpiry = 0;
    this.hasSheetsScope = false;
    try {
      localStorage.removeItem('gsheets_access_token');
      localStorage.removeItem('gsheets_token_expiry');
      localStorage.removeItem('gsheets_has_scope');
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Requests Google OAuth token with Sheets and Drive scopes using GIS.
   * If promptUser is false, it requests access silently in the background without popups.
   */
  public static async requestAuth(clientId?: string, promptUser: boolean = true): Promise<string> {
    if (this.authInProgressPromise) {
      return this.authInProgressPromise;
    }

    this.authInProgressPromise = new Promise<string>((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        this.authInProgressPromise = null;
        reject(new Error('Google Identity Services script not loaded. Please check your internet connection.'));
        return;
      }

      const effectiveClientId =
        clientId ||
        (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
        '422143617564-iu1l933qg3c28h26r5hekhnoimuo334d.apps.googleusercontent.com';

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: SCOPES,
          callback: (response) => {
            this.authInProgressPromise = null;
            if (response.error) {
              reject(new Error(`Google Authentication: ${response.error}`));
              return;
            }
            if (response.access_token) {
              this.setToken(response.access_token, 3600, true);
              resolve(response.access_token);
            } else {
              reject(new Error('No access token returned from Google.'));
            }
          },
        });

        if (!promptUser) {
          client.requestAccessToken({ prompt: '' });
        } else {
          client.requestAccessToken();
        }
      } catch (err: any) {
        this.authInProgressPromise = null;
        reject(new Error(err?.message || 'Failed to initialize Google token client'));
      }
    });

    return this.authInProgressPromise;
  }

  /**
   * Get a valid token or silently refresh in background without prompting user.
   */
  public static async getValidTokenOrRefresh(interactiveFallback: boolean = false): Promise<string | null> {
    const existing = this.getToken();
    if (existing && Date.now() + 120000 < this.tokenExpiry) {
      return existing;
    }

    // Try background silent refresh first
    try {
      const refreshed = await this.requestAuth(undefined, false);
      if (refreshed) return refreshed;
    } catch {
      // Silent refresh was not possible
    }

    if (existing && Date.now() < this.tokenExpiry) {
      return existing;
    }

    if (interactiveFallback) {
      try {
        return await this.requestAuth(undefined, true);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Creates a structured Google Spreadsheet with the 7 required sheets
   */
  public static async createStoreDatabase(shopName: string): Promise<{ id: string; url: string }> {
    let token = await this.getValidTokenOrRefresh(true);
    if (!token) {
      throw new Error('গুগল অ্যাকাউন্ট অনুমোদন করা সম্ভব হয়নি।');
    }

    const title = `Universal Store Database - ${shopName || 'My Shop'}`;
    const sheetsList = [
      { properties: { title: 'Products' } },
      { properties: { title: 'Sales' } },
      { properties: { title: 'SaleItems' } },
      { properties: { title: 'Customers' } },
      { properties: { title: 'Payments' } },
      { properties: { title: 'Expenses' } },
      { properties: { title: 'Settings' } },
    ];

    let response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: sheetsList,
      }),
    });

    // Auto retry on 401
    if (response.status === 401) {
      token = await this.requestAuth(undefined, false).catch(() => null);
      if (token) {
        response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: { title },
            sheets: sheetsList,
          }),
        });
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    await this.initializeSheetHeaders(spreadsheetId, token);

    return { id: spreadsheetId, url: spreadsheetUrl };
  }

  /**
   * Initializes the column headers for all 7 sheets
   */
  private static async initializeSheetHeaders(spreadsheetId: string, token: string) {
    const headerData = [
      {
        range: 'Products!A1:L1',
        values: [[
          'Product ID',
          'Product Name',
          'Category',
          'Unit',
          'Purchase Price (৳)',
          'Sale Price (৳)',
          'Current Stock',
          'Min Stock Alert',
          'Barcode',
          'Expiry Date',
          'Extra Info / Brand',
          'Updated At',
        ]],
      },
      {
        range: 'Sales!A1:L1',
        values: [[
          'Invoice ID',
          'Customer Name',
          'Customer Phone',
          'Subtotal (৳)',
          'Discount (৳)',
          'Total Amount (৳)',
          'Paid Amount (৳)',
          'Due Amount (৳)',
          'Payment Method',
          'Payment Details',
          'Total Profit (৳)',
          'Date Time',
        ]],
      },
      {
        range: 'SaleItems!A1:K1',
        values: [[
          'Item ID',
          'Sale Invoice ID',
          'Product ID',
          'Product Name',
          'Unit',
          'Quantity',
          'Purchase Price (৳)',
          'Sale Price (৳)',
          'Total Price (৳)',
          'Profit (৳)',
          'Date Time',
        ]],
      },
      {
        range: 'Customers!A1:G1',
        values: [[
          'Customer ID',
          'Customer Name',
          'Mobile Number',
          'Address / Area',
          'Total Due (৳)',
          'Total Purchases (৳)',
          'Last Transaction Date',
        ]],
      },
      {
        range: 'Payments!A1:J1',
        values: [[
          'Payment ID',
          'Customer ID',
          'Customer Name',
          'Amount Paid (৳)',
          'Payment Method',
          'Trx ID',
          'Previous Due (৳)',
          'Remaining Due (৳)',
          'Note / Remarks',
          'Date Time',
        ]],
      },
      {
        range: 'Expenses!A1:G1',
        values: [[
          'Expense ID',
          'Title / Purpose',
          'Category',
          'Amount (৳)',
          'Payment Method',
          'Note',
          'Date Time',
        ]],
      },
      {
        range: 'Settings!A1:C1',
        values: [[
          'Key',
          'Value',
          'Description',
        ]],
      },
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headerData,
      }),
    });
  }

  /**
   * Complete Sheet Clearing Helper - Wipes all rows (from row 2 down) reliably
   */
  public static async clearAllSpreadsheetData(spreadsheetId: string): Promise<boolean> {
    let token = await this.getValidTokenOrRefresh(false);
    if (!token || !spreadsheetId) return false;

    const clearRanges = [
      'Products!A2:Z',
      'Sales!A2:Z',
      'SaleItems!A2:Z',
      'Customers!A2:Z',
      'Payments!A2:Z',
      'Expenses!A2:Z',
      'Settings!A2:Z',
    ];

    try {
      let clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ranges: clearRanges }),
      });

      if (clearRes.status === 401) {
        token = await this.requestAuth(undefined, false).catch(() => null);
        if (token) {
          clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ranges: clearRanges }),
          });
        }
      }

      return clearRes.ok;
    } catch {
      return false;
    }
  }

  /**
   * Syncs complete store dataset to Google Sheets with automatic self-healing reconnection.
   * GUARANTEES that deleted items are completely removed from Google Sheets.
   */
  public static async syncAllData(
    spreadsheetId: string,
    data: {
      products: Product[];
      sales: Sale[];
      customers: Customer[];
      payments: Payment[];
      expenses: Expense[];
      settings: StoreSettings;
    }
  ): Promise<SyncResult> {
    let token = await this.getValidTokenOrRefresh(false);
    if (!token) {
      return { success: false, isAuthRequired: true, message: 'Google authentication required' };
    }

    try {
      // 1. Products Rows
      const productRows = data.products
        .filter((p) => p && p.name && !isItemDeleted(p.id, p.barcode))
        .map((p) => [
          p.id,
          p.name,
          p.category,
          p.unit,
          p.purchasePrice,
          p.salePrice,
          p.currentStock,
          p.minStock,
          p.barcode || '',
          p.expiryDate || '',
          p.extraInfo || '',
          p.updatedAt || p.createdAt || new Date().toISOString(),
        ]);

      // 2. Sales & SaleItems Rows
      const activeSales = data.sales.filter((s) => s && (s.invoiceNumber || s.id) && !isItemDeleted(s.id, s.invoiceNumber));
      const saleRows = activeSales.map((s) => [
        s.invoiceNumber || s.id,
        s.customerName,
        s.customerPhone || '',
        s.subtotal,
        s.discount,
        s.totalAmount,
        s.paidAmount,
        s.dueAmount,
        s.paymentMethod,
        s.paymentDetails || '',
        s.totalProfit,
        s.createdAt,
      ]);

      const saleItemRows: any[][] = [];
      activeSales.forEach((s) => {
        if (s.items && s.items.length > 0) {
          s.items.forEach((item) => {
            saleItemRows.push([
              item.id,
              s.invoiceNumber || s.id,
              item.productId,
              item.productName,
              item.unit,
              item.quantity,
              item.purchasePrice,
              item.salePrice,
              item.totalPrice,
              item.profit,
              item.createdAt || s.createdAt,
            ]);
          });
        }
      });

      // 3. Customers Rows
      const customerRows = data.customers
        .filter((c) => c && c.name && !isItemDeleted(c.id, c.phone))
        .map((c) => [
          c.id,
          c.name,
          c.phone,
          c.address || '',
          c.totalDue,
          c.totalPurchases,
          c.lastTransactionDate || '',
        ]);

      // 4. Payments Rows
      const paymentRows = data.payments
        .filter((p) => p && !isItemDeleted(p.id, p.trxId))
        .map((p) => [
          p.id,
          p.customerId,
          p.customerName,
          p.amount,
          p.paymentMethod,
          p.trxId || '',
          p.previousDue,
          p.remainingDue,
          p.note || '',
          p.createdAt,
        ]);

      // 5. Expenses Rows
      const expenseRows = data.expenses
        .filter((e) => e && !isItemDeleted(e.id))
        .map((e) => [
          e.id,
          e.title,
          e.category,
          e.amount,
          e.paymentMethod,
          e.note || '',
          e.createdAt,
        ]);

      // 6. Settings Rows
      const settingsRows = [
        ['shopName', data.settings.shopName || '', 'Shop Display Name'],
        ['shopPhone', data.settings.shopPhone || '', 'Shop Contact Phone'],
        ['shopAddress', data.settings.shopAddress || '', 'Shop Address'],
        ['currency', data.settings.currency || 'BDT', 'Active Currency'],
        ['language', data.settings.language || 'bn', 'App Language'],
        ['lastSyncTime', new Date().toISOString(), 'Last Successful Cloud Sync'],
      ];

      // CRITICAL: Clear existing rows across all sheets first so NO deleted or ghost rows remain
      const clearRanges = [
        'Products!A2:Z',
        'Sales!A2:Z',
        'SaleItems!A2:Z',
        'Customers!A2:Z',
        'Payments!A2:Z',
        'Expenses!A2:Z',
        'Settings!A2:Z',
      ];

      try {
        let clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ranges: clearRanges }),
        });

        // 401 retry on clear
        if (clearRes.status === 401) {
          const freshToken = await this.requestAuth(undefined, false).catch(() => null);
          if (freshToken) {
            token = freshToken;
            clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ranges: clearRanges }),
            });
          }
        }
      } catch (clearErr) {
        console.warn('Batch clear warning, proceeding with batch update:', clearErr);
      }

      // Build batch update data containing only current valid rows
      const dataToUpdate: Array<{ range: string; values: any[][] }> = [];

      if (productRows.length > 0) {
        dataToUpdate.push({
          range: `Products!A2:L${productRows.length + 1}`,
          values: productRows,
        });
      }

      if (saleRows.length > 0) {
        dataToUpdate.push({
          range: `Sales!A2:L${saleRows.length + 1}`,
          values: saleRows,
        });
      }

      if (saleItemRows.length > 0) {
        dataToUpdate.push({
          range: `SaleItems!A2:K${saleItemRows.length + 1}`,
          values: saleItemRows,
        });
      }

      if (customerRows.length > 0) {
        dataToUpdate.push({
          range: `Customers!A2:G${customerRows.length + 1}`,
          values: customerRows,
        });
      }

      if (paymentRows.length > 0) {
        dataToUpdate.push({
          range: `Payments!A2:J${paymentRows.length + 1}`,
          values: paymentRows,
        });
      }

      if (expenseRows.length > 0) {
        dataToUpdate.push({
          range: `Expenses!A2:G${expenseRows.length + 1}`,
          values: expenseRows,
        });
      }

      if (settingsRows.length > 0) {
        dataToUpdate.push({
          range: `Settings!A2:C${settingsRows.length + 1}`,
          values: settingsRows,
        });
      }

      if (dataToUpdate.length > 0) {
        let updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              valueInputOption: 'USER_ENTERED',
              data: dataToUpdate,
            }),
          }
        );

        // Auto retry once on 401 by attempting background silent refresh
        if (updateRes.status === 401) {
          const freshToken = await this.requestAuth(undefined, false).catch(() => null);
          if (freshToken) {
            token = freshToken;
            updateRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  valueInputOption: 'USER_ENTERED',
                  data: dataToUpdate,
                }),
              }
            );
          }
        }

        if (!updateRes.ok) {
          if (updateRes.status === 401) {
            return {
              success: false,
              isAuthRequired: true,
              message: 'গুগল লগইন সেশন শেষ হয়েছে। পুনরায় কানেক্ট করতে ১-ক্লিক করুন।',
            };
          }
          const err = await updateRes.json().catch(() => ({}));
          return { success: false, message: err.error?.message || `Sync failed with status ${updateRes.status}` };
        }
      }

      return {
        success: true,
        message: 'গুগল শিটে সমস্ত ডাটা নির্ভুলভাবে সিঙ্ক হয়েছে (মুছে ফেলা ডাটা সফলভাবে রিমুভ করা হয়েছে)!',
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error occurred while syncing with Google Sheets' };
    }
  }

  /**
   * Append a single new Sale transaction to Google Sheets
   */
  public static async appendSale(spreadsheetId: string, sale: Sale): Promise<boolean> {
    const token = await this.getValidTokenOrRefresh(false);
    if (!token || !spreadsheetId) return false;
    if (isItemDeleted(sale.id, sale.invoiceNumber)) return false;

    try {
      const saleRow = [
        sale.invoiceNumber || sale.id,
        sale.customerName,
        sale.customerPhone || '',
        sale.subtotal,
        sale.discount,
        sale.totalAmount,
        sale.paidAmount,
        sale.dueAmount,
        sale.paymentMethod,
        sale.paymentDetails || '',
        sale.totalProfit,
        sale.createdAt,
      ];

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sales!A:L:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [saleRow] }),
        }
      );

      if (sale.items && sale.items.length > 0) {
        const itemRows = sale.items.map((it) => [
          it.id,
          sale.invoiceNumber || sale.id,
          it.productId,
          it.productName,
          it.unit,
          it.quantity,
          it.purchasePrice,
          it.salePrice,
          it.totalPrice,
          it.profit,
          it.createdAt,
        ]);

        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SaleItems!A:K:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: itemRows }),
          }
        );
      }
      return true;
    } catch (e) {
      console.error('Incremental sale sync error:', e);
      return false;
    }
  }

  /**
   * Fetch all data from an existing Google Sheet (to restore/pull on another device like mobile)
   */
  public static async fetchDataFromGoogleSheets(spreadsheetId: string): Promise<{
    success: boolean;
    data?: {
      products: Product[];
      sales: Sale[];
      customers: Customer[];
      payments: Payment[];
      expenses: Expense[];
      settings: Partial<StoreSettings>;
    };
    message: string;
  }> {
    let token = await this.getValidTokenOrRefresh(false);
    if (!token) {
      return { success: false, message: 'Google authentication required.' };
    }

    try {
      const ranges = [
        'Products!A2:L',
        'Sales!A2:L',
        'SaleItems!A2:K',
        'Customers!A2:G',
        'Payments!A2:J',
        'Expenses!A2:G',
        'Settings!A2:B',
      ];
      const rangesParam = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
      let response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Auto retry on 401
      if (response.status === 401) {
        const freshToken = await this.requestAuth(undefined, false).catch(() => null);
        if (freshToken) {
          token = freshToken;
          response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesParam}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          message: err.error?.message || `Failed to fetch data from spreadsheet (${response.status})`,
        };
      }

      const resJson = await response.json();
      const valueRanges = resJson.valueRanges || [];

      // 1. Parse Products
      const productRows = valueRanges[0]?.values || [];
      const products: Product[] = productRows
        .filter((r: any[]) => r && r[1]) // Must have at least product name
        .map((r: any[], idx: number) => {
          const id = r[0] ? String(r[0]).trim() : `prod-${Date.now()}-${idx + 1}`;
          const barcode = r[8] ? String(r[8]).trim() : undefined;
          return {
            id,
            name: String(r[1] || 'Product').trim(),
            category: r[2] || 'General Retail',
            unit: r[3] || 'pcs',
            purchasePrice: Number(r[4]) || 0,
            salePrice: Number(r[5]) || 0,
            currentStock: Number(r[6]) || 0,
            minStock: Number(r[7]) || 5,
            barcode,
            expiryDate: r[9] ? String(r[9]).trim() : undefined,
            extraInfo: r[10] ? String(r[10]).trim() : undefined,
            createdAt: r[11] || new Date().toISOString(),
            updatedAt: r[11] || new Date().toISOString(),
          };
        })
        .filter((p: Product) => !isItemDeleted(p.id, p.barcode));

      // 2. Parse Sale Items
      const saleItemRows = valueRanges[2]?.values || [];
      const saleItemsByInvoice: Record<string, SaleItem[]> = {};
      saleItemRows.forEach((r: any[], idx: number) => {
        const invoiceNum = r[1] ? String(r[1]).trim() : '';
        if (!invoiceNum) return;
        const item: SaleItem = {
          id: r[0] ? String(r[0]).trim() : `item-${idx + 1}`,
          saleId: invoiceNum,
          productId: r[2] ? String(r[2]).trim() : '',
          productName: r[3] ? String(r[3]).trim() : '',
          unit: r[4] || 'pcs',
          quantity: Number(r[5]) || 1,
          purchasePrice: Number(r[6]) || 0,
          salePrice: Number(r[7]) || 0,
          totalPrice: Number(r[8]) || 0,
          profit: Number(r[9]) || 0,
          createdAt: r[10] || new Date().toISOString(),
        };
        if (!saleItemsByInvoice[invoiceNum]) {
          saleItemsByInvoice[invoiceNum] = [];
        }
        saleItemsByInvoice[invoiceNum].push(item);
      });

      // 3. Parse Sales
      const saleRows = valueRanges[1]?.values || [];
      const sales: Sale[] = saleRows
        .filter((r: any[]) => r && (r[0] || r[1]))
        .map((r: any[], idx: number) => {
          const invoiceNumber = r[0] ? String(r[0]).trim() : `INV-${1000 + idx}`;
          return {
            id: invoiceNumber,
            invoiceNumber,
            customerName: r[1] || 'নগদ ক্রেতা (Walk-in)',
            customerPhone: r[2] ? String(r[2]).trim() : undefined,
            subtotal: Number(r[3]) || 0,
            discount: Number(r[4]) || 0,
            totalAmount: Number(r[5]) || 0,
            paidAmount: Number(r[6]) || 0,
            dueAmount: Number(r[7]) || 0,
            paymentMethod: (r[8] as any) || 'Cash',
            paymentDetails: r[9] || undefined,
            totalProfit: Number(r[10]) || 0,
            itemsCount: (saleItemsByInvoice[invoiceNumber] || []).reduce((acc, it) => acc + it.quantity, 0),
            createdAt: r[11] || new Date().toISOString(),
            items: saleItemsByInvoice[invoiceNumber] || [],
          };
        })
        .filter((s: Sale) => !isItemDeleted(s.id, s.invoiceNumber));

      // 4. Parse Customers
      const customerRows = valueRanges[3]?.values || [];
      const customers: Customer[] = customerRows
        .filter((r: any[]) => r && r[1])
        .map((r: any[], idx: number) => ({
          id: r[0] ? String(r[0]).trim() : `cust-${Date.now()}-${idx + 1}`,
          name: String(r[1] || '').trim(),
          phone: String(r[2] || '').trim(),
          address: r[3] || '',
          totalDue: Number(r[4]) || 0,
          totalPurchases: Number(r[5]) || 0,
          lastTransactionDate: r[6] || undefined,
          createdAt: new Date().toISOString(),
        }))
        .filter((c: Customer) => !isItemDeleted(c.id, c.phone));

      // 5. Parse Payments
      const paymentRows = valueRanges[4]?.values || [];
      const payments: Payment[] = paymentRows
        .filter((r: any[]) => r && (r[1] || r[2]))
        .map((r: any[], idx: number) => ({
          id: r[0] ? String(r[0]).trim() : `pay-${Date.now()}-${idx + 1}`,
          customerId: r[1] ? String(r[1]).trim() : '',
          customerName: r[2] || '',
          amount: Number(r[3]) || 0,
          paymentMethod: (r[4] as any) || 'Cash',
          trxId: r[5] || undefined,
          previousDue: Number(r[6]) || 0,
          remainingDue: Number(r[7]) || 0,
          note: r[8] || undefined,
          createdAt: r[9] || new Date().toISOString(),
        }))
        .filter((p: Payment) => !isItemDeleted(p.id, p.trxId));

      // 6. Parse Expenses
      const expenseRows = valueRanges[5]?.values || [];
      const expenses: Expense[] = expenseRows
        .filter((r: any[]) => r && r[1])
        .map((r: any[], idx: number) => ({
          id: r[0] ? String(r[0]).trim() : `exp-${Date.now()}-${idx + 1}`,
          title: r[1] || 'Expense',
          category: (r[2] as any) || 'Other',
          amount: Number(r[3]) || 0,
          paymentMethod: (r[4] as any) || 'Cash',
          note: r[5] || undefined,
          createdAt: r[6] || new Date().toISOString(),
        }))
        .filter((e: Expense) => !isItemDeleted(e.id));

      // 7. Parse Settings
      const settingsRows = valueRanges[6]?.values || [];
      const fetchedSettings: Partial<StoreSettings> = {};
      settingsRows.forEach((r: any[]) => {
        const key = r[0];
        const val = r[1];
        if (key && val) {
          (fetchedSettings as any)[key] = val;
        }
      });

      return {
        success: true,
        data: {
          products,
          sales,
          customers,
          payments,
          expenses,
          settings: fetchedSettings,
        },
        message: 'Data successfully pulled from Google Sheets.',
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error pulling data from Google Sheets' };
    }
  }
}
