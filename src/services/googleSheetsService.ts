import { Product, Sale, SaleItem, Customer, Payment, Expense, StoreSettings } from '../types';

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
            requestAccessToken: () => void;
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
}

export class GoogleSheetsService {
  private static token: string | null = null;
  private static tokenExpiry: number = 0;
  private static hasSheetsScope: boolean = false;

  public static setToken(token: string, expiresInSeconds: number = 3600, hasSheetsScope: boolean = true) {
    this.token = token;
    this.hasSheetsScope = hasSheetsScope;
    this.tokenExpiry = Date.now() + (expiresInSeconds - 60) * 1000;
    localStorage.setItem('gsheets_access_token', token);
    localStorage.setItem('gsheets_token_expiry', this.tokenExpiry.toString());
    localStorage.setItem('gsheets_has_scope', hasSheetsScope ? 'true' : 'false');
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
    localStorage.removeItem('gsheets_access_token');
    localStorage.removeItem('gsheets_token_expiry');
    localStorage.removeItem('gsheets_has_scope');
  }

  /**
   * Requests Google OAuth token with Sheets and Drive scopes using GIS
   */
  public static async requestAuth(clientId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services script not loaded. Please check your internet connection.'));
        return;
      }

      // Check client_id from env, firebase config or fallback
      const effectiveClientId =
        clientId ||
        (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
        '422143617564-iu1l933qg3c28h26r5hekhnoimuo334d.apps.googleusercontent.com';

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: SCOPES,
          callback: (response) => {
            if (response.error) {
              reject(new Error(`Google Authentication Failed: ${response.error}`));
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
        client.requestAccessToken();
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to initialize Google token client'));
      }
    });
  }

  /**
   * Creates a structured Google Spreadsheet with the 7 required sheets
   */
  public static async createStoreDatabase(shopName: string): Promise<{ id: string; url: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Please sign in to Google first.');
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

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
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

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Initialize Headers for each sheet
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
   * Syncs complete store dataset to Google Sheets
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
    const token = this.getToken();
    if (!token) {
      return { success: false, message: 'Google authentication required' };
    }

    try {
      // 1. Prepare Products Rows
      const productRows = data.products.map((p) => [
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
        p.updatedAt || new Date().toISOString(),
      ]);

      // 2. Prepare Sales & SaleItems Rows
      const saleRows = data.sales.map((s) => [
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
      data.sales.forEach((s) => {
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

      // 3. Prepare Customers Rows
      const customerRows = data.customers.map((c) => [
        c.id,
        c.name,
        c.phone,
        c.address || '',
        c.totalDue,
        c.totalPurchases,
        c.lastTransactionDate || '',
      ]);

      // 4. Prepare Payments Rows
      const paymentRows = data.payments.map((p) => [
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

      // 5. Prepare Expenses Rows
      const expenseRows = data.expenses.map((e) => [
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
        ['shopName', data.settings.shopName, 'Shop Display Name'],
        ['shopPhone', data.settings.shopPhone, 'Shop Contact Phone'],
        ['shopAddress', data.settings.shopAddress, 'Shop Address'],
        ['currency', data.settings.currency, 'Active Currency'],
        ['language', data.settings.language, 'App Language'],
        ['lastSyncTime', new Date().toISOString(), 'Last Successful Cloud Sync'],
      ];

      // Clear & Write in bulk using batchUpdate
      const batchPayload = {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Products!A2:L' + (productRows.length + 1), values: productRows },
          { range: 'Sales!A2:L' + (saleRows.length + 1), values: saleRows },
          { range: 'SaleItems!A2:K' + (saleItemRows.length + 1), values: saleItemRows },
          { range: 'Customers!A2:G' + (customerRows.length + 1), values: customerRows },
          { range: 'Payments!A2:J' + (paymentRows.length + 1), values: paymentRows },
          { range: 'Expenses!A2:G' + (expenseRows.length + 1), values: expenseRows },
          { range: 'Settings!A2:C' + (settingsRows.length + 1), values: settingsRows },
        ],
      };

      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchPayload),
        }
      );

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        return { success: false, message: err.error?.message || `Sync failed with status ${updateRes.status}` };
      }

      return {
        success: true,
        message: 'All store data synced to Google Sheets successfully!',
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error occurred while syncing with Google Sheets' };
    }
  }

  /**
   * Append a single new Sale transaction to Google Sheets (fast incremental sync)
   */
  public static async appendSale(spreadsheetId: string, sale: Sale): Promise<boolean> {
    const token = this.getToken();
    if (!token || !spreadsheetId) return false;

    try {
      const saleRow = [
        sale.invoiceNumber,
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
          sale.invoiceNumber,
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
}
