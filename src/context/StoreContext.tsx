import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Product,
  Sale,
  SaleItem,
  Customer,
  Payment,
  Expense,
  StoreSettings,
  DashboardMetrics,
  CartItem,
  PaymentMethod,
  User,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
} from '../services/mockInitialData';
import { generateId, isToday, isThisMonth } from '../utils/formatters';
import { translations, Language } from '../utils/i18n';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { googleSignIn, logout as firebaseLogout } from '../services/firebaseAuth';
import {
  mergeProducts,
  mergeSales,
  mergeCustomers,
  mergePayments,
  mergeExpenses,
} from '../utils/dataMerge';
import { recordDeletedId, clearAllDeletedIds } from '../utils/tombstones';

interface StoredUserAccount extends User {
  password?: string;
}

const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'user-default-0',
    name: 'আরাফাত শুভ',
    email: 'arafatshuvo941@gmail.com',
    shopName: 'আরাফাত স্টোর',
    phone: '01700000000',
    createdAt: new Date().toISOString(),
    password: '123456',
  },
  {
    id: 'user-default-1',
    name: 'মোঃ শফিকুল ইসলাম',
    email: 'md.sofiqulislamkhan@gmail.com',
    shopName: 'সাবির জেনারেল স্টোর',
    phone: '01712345678',
    createdAt: new Date().toISOString(),
    password: '123456',
  },
  {
    id: 'user-demo-2',
    name: 'সাবির হোসেন',
    email: 'demo.store@gmail.com',
    shopName: 'সাবির ট্রেডার্স',
    phone: '01811223344',
    createdAt: new Date().toISOString(),
    password: '123456',
  },
];

interface StoreContextType {
  // Auth state & actions
  currentUser: User | null;
  signInWithGmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithGmail: (params: {
    name: string;
    email: string;
    password?: string;
    shopName: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogleOneClick: (email?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  clearDatabase: () => void;

  // Data
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  payments: Payment[];
  expenses: Expense[];
  settings: StoreSettings;
  metrics: DashboardMetrics;

  // Cart & POS Active State
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartItemPrice: (productId: string, unitPrice: number) => void;
  clearCart: () => void;

  // Sale Checkout & Modifications
  processSale: (params: {
    customer?: Customer | null;
    walkInName?: string;
    customerPhone?: string;
    discount: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    paymentDetails?: string;
    saleDate?: string;
  }) => Promise<{ success: boolean; sale?: Sale; error?: string }>;
  updateSaleDate: (saleId: string, newDateIso: string) => void;
  updateSale: (saleId: string, updates: Partial<Sale>) => void;
  deleteSale: (saleId: string) => void;

  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, addedQty: number, newPurchasePrice?: number) => void;

  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalDue' | 'totalPurchases'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  receiveCustomerPayment: (params: {
    customerId: string;
    amount: number;
    paymentMethod: 'Cash' | 'bKash' | 'Nagad';
    trxId?: string;
    note?: string;
  }) => Promise<{ success: boolean; payment?: Payment; error?: string }>;
  deletePayment: (id: string) => void;

  // Expense Actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Settings & Google Sheets Sync
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  syncWithGoogleSheets: (sheetId?: string) => Promise<{ success: boolean; message: string }>;
  pullFromGoogleSheets: (sheetId?: string) => Promise<{ success: boolean; message: string }>;
  connectGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  createNewGoogleSheetDatabase: (forceNew?: boolean) => Promise<{ success: boolean; message: string; url?: string }>;
  disconnectGoogleSheets: () => void;
  isGoogleConnected: boolean;

  // i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], params?: Record<string, string | number>) => string;

  // Active UI Tabs
  activeTab: 'dashboard' | 'sales' | 'products' | 'customers' | 'expenses' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'sales' | 'products' | 'customers' | 'expenses' | 'reports') => void;

  // Last completed sale (for instant receipt modal)
  lastSale: Sale | null;
  setLastSale: (sale: Sale | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'usb_store_users',
  CURRENT_USER: 'usb_store_current_user',
  PRODUCTS: 'usb_store_products',
  SALES: 'usb_store_sales',
  CUSTOMERS: 'usb_store_customers',
  PAYMENTS: 'usb_store_payments',
  EXPENSES: 'usb_store_expenses',
  SETTINGS: 'usb_store_settings',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. Auth State
  const [users, setUsers] = useState<StoredUserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : null;
  });

  // 1. Initial State from localStorage or Seeds
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Navigation & POS Cart State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'products' | 'customers' | 'expenses' | 'reports'>('dashboard');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => Boolean(settings.spreadsheetId));

  // Keep isGoogleConnected in sync with spreadsheetId
  useEffect(() => {
    setIsGoogleConnected(Boolean(settings.spreadsheetId));
  }, [settings.spreadsheetId]);

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // --- Persistent Background Google Connection Health-Check & Auto-Renewal ---
  useEffect(() => {
    if (!settings.spreadsheetId) return;

    const performSilentRenewal = async () => {
      try {
        const token = await GoogleSheetsService.getValidTokenOrRefresh(false);
        if (token) {
          setIsGoogleConnected(true);
          if (settings.syncStatus === 'needs_auth') {
            setSettings((prev) => ({ ...prev, syncStatus: 'synced', syncError: undefined }));
          }
        }
      } catch (err) {
        console.debug('Background silent renewal check:', err);
      }
    };

    // Run on startup
    performSilentRenewal();

    // Run every 5 minutes so token stays active forever in the background
    const interval = setInterval(performSilentRenewal, 5 * 60 * 1000);

    // Also run whenever user switches tabs or focuses the window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSilentRenewal();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [settings.spreadsheetId, settings.syncStatus]);

  // --- Google Sheets Auto-Sync (Debounced) ---
  const syncDataRef = useRef({ products, sales, customers, payments, expenses, settings });
  
  // Keep the ref updated with the latest data
  useEffect(() => {
    syncDataRef.current = { products, sales, customers, payments, expenses, settings };
  }, [products, sales, customers, payments, expenses, settings]);

  useEffect(() => {
    // Only run if we have a spreadsheet ID configured
    if (!settings.spreadsheetId) return;

    const timer = setTimeout(async () => {
      // Check if we have a valid token or silently refresh
      const token = await GoogleSheetsService.getValidTokenOrRefresh(false);

      if (!token) {
        setSettings((prev) => ({
          ...prev,
          syncStatus: 'needs_auth',
          syncError: 'গুগল টোকেন রিনিউ করতে ১-ক্লিক করুন',
        }));
        return;
      }

      try {
        setSettings((prev) => ({ ...prev, syncStatus: 'syncing' }));
        
        // Grab latest data from ref to prevent stale closures
        const data = syncDataRef.current;
        const result = await GoogleSheetsService.syncAllData(settings.spreadsheetId, data);
        
        if (result.success) {
          setSettings((prev) => ({
            ...prev,
            syncStatus: 'synced',
            lastSyncTime: new Date().toISOString(),
            syncError: undefined,
          }));
        } else if (result.isAuthRequired) {
          setSettings((prev) => ({
            ...prev,
            syncStatus: 'needs_auth',
            syncError: 'গুগল সেশন শেষ হয়েছে। রিনিউ করতে ক্লিক করুন।',
          }));
        } else {
          setSettings((prev) => ({
            ...prev,
            syncStatus: 'error',
            syncError: result.message,
          }));
        }
      } catch (err: any) {
        setSettings((prev) => ({
          ...prev,
          syncStatus: 'error',
          syncError: err?.message || 'Sync failed',
        }));
      }
    }, 2000); // 2-second debounce

    return () => clearTimeout(timer);
  }, [products, sales, customers, payments, expenses, settings.spreadsheetId]);

  // Language translation helper
  const language = settings.language || 'bn';
  const setLanguage = useCallback((lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
  }, []);

  const t = useCallback(
    (key: keyof typeof translations['en'], params?: Record<string, string | number>): string => {
      let str = translations[language]?.[key] || translations['en'][key] || String(key);
      if (params) {
        Object.entries(params).forEach(([pKey, pVal]) => {
          str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        });
      }
      return str;
    },
    [language]
  );

  // 2. Automated Calculations for Dashboard
  const metrics: DashboardMetrics = useMemo(() => {
    let todaySales = 0;
    let todayProfit = 0;
    let todaySalesCount = 0;

    sales.forEach((sale) => {
      if (isToday(sale.createdAt)) {
        todaySales += sale.totalAmount;
        todayProfit += sale.totalProfit;
        todaySalesCount += 1;
      }
    });

    let totalDue = 0;
    customers.forEach((cust) => {
      totalDue += cust.totalDue || 0;
    });

    let totalStockCount = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;

    products.forEach((prod) => {
      totalStockCount += prod.currentStock;
      totalStockValue += prod.currentStock * prod.purchasePrice;
      if (prod.currentStock <= prod.minStock) {
        lowStockCount += 1;
      }
    });

    let todayExpenses = 0;
    expenses.forEach((exp) => {
      if (isToday(exp.createdAt)) {
        todayExpenses += exp.amount;
      }
    });

    const netTodayProfit = todayProfit - todayExpenses;

    return {
      todaySales,
      todayProfit,
      todaySalesCount,
      totalDue,
      totalStockCount,
      totalStockValue,
      lowStockCount,
      todayExpenses,
      netTodayProfit,
    };
  }, [sales, customers, products, expenses]);

  // 3. Cart / POS Actions
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const total = newQty * existing.unitPrice;
        const profit = (existing.unitPrice - existing.purchasePrice) * newQty;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, total, profit }
            : item
        );
      } else {
        const unitPrice = product.salePrice;
        const purchasePrice = product.purchasePrice;
        const total = quantity * unitPrice;
        const profit = (unitPrice - purchasePrice) * quantity;
        return [...prev, { product, quantity, unitPrice, purchasePrice, total, profit }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const total = quantity * item.unitPrice;
          const profit = (item.unitPrice - item.purchasePrice) * quantity;
          return { ...item, quantity, total, profit };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const updateCartItemPrice = useCallback((productId: string, unitPrice: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const total = item.quantity * unitPrice;
          const profit = (unitPrice - item.purchasePrice) * item.quantity;
          return { ...item, unitPrice, total, profit };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // 4. Automated Sales Checkout Engine
  const processSale = async ({
    customer,
    walkInName,
    customerPhone,
    discount,
    paidAmount,
    paymentMethod,
    paymentDetails,
    saleDate,
  }: {
    customer?: Customer | null;
    walkInName?: string;
    customerPhone?: string;
    discount: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    paymentDetails?: string;
    saleDate?: string;
  }): Promise<{ success: boolean; sale?: Sale; error?: string }> => {
    if (cart.length === 0) {
      return { success: false, error: 'Cart is empty!' };
    }

    // Step 1: Validate and compute totals
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = Math.max(0, subtotal - (discount || 0));
    
    // Determine paid vs due based on payment method & input
    let finalPaidAmount = paidAmount;
    let finalDueAmount = 0;

    if (paymentMethod === 'Due') {
      finalPaidAmount = 0;
      finalDueAmount = totalAmount;
    } else {
      // If paidAmount is provided and less than totalAmount, handle as partial/split payment
      if (typeof paidAmount === 'number' && !isNaN(paidAmount) && paidAmount < totalAmount) {
        finalPaidAmount = Math.max(0, paidAmount);
        finalDueAmount = Math.max(0, totalAmount - finalPaidAmount);
      } else {
        finalPaidAmount = totalAmount;
        finalDueAmount = 0;
      }
    }

    // If due amount exists, customer must be provided
    if (finalDueAmount > 0 && !customer) {
      return {
        success: false,
        error: 'Due sales require selecting or creating a customer to track in the Due Ledger.',
      };
    }

    const saleId = generateId('INV');
    const invoiceNumber = saleId;
    const nowIso = saleDate ? new Date(saleDate).toISOString() : new Date().toISOString();

    // Step 2: Build SaleItems & compute total profit accurately
    let totalSaleProfit = 0;
    const saleItems: SaleItem[] = cart.map((item) => {
      const itemProfit = (item.unitPrice - item.purchasePrice) * item.quantity;
      totalSaleProfit += itemProfit;
      return {
        id: generateId('ITM'),
        saleId,
        productId: item.product.id,
        productName: item.product.name,
        unit: item.product.unit,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        salePrice: item.unitPrice,
        totalPrice: item.total,
        profit: itemProfit,
        createdAt: nowIso,
      };
    });

    // Subtract overall invoice discount from profit
    totalSaleProfit = Math.max(0, totalSaleProfit - (discount || 0));

    const newSale: Sale = {
      id: saleId,
      invoiceNumber,
      customerId: customer?.id,
      customerName: customer ? customer.name : (walkInName || 'নগদ ক্রেতা (Walk-in)'),
      customerPhone: customer ? customer.phone : (customerPhone || ''),
      subtotal,
      discount: discount || 0,
      totalAmount,
      paidAmount: finalPaidAmount,
      dueAmount: finalDueAmount,
      paymentMethod,
      paymentDetails,
      totalProfit: totalSaleProfit,
      itemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      items: saleItems,
      createdAt: nowIso,
    };

    // Step 3: AUTOMATICALLY DEDUCT INVENTORY
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const soldItem = cart.find((it) => it.product.id === prod.id);
        if (soldItem) {
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - soldItem.quantity),
            updatedAt: nowIso,
          };
        }
        return prod;
      })
    );

    // Step 4: AUTOMATICALLY UPDATE CUSTOMER DUE & PURCHASES
    if (customer) {
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) => {
          if (c.id === customer.id) {
            return {
              ...c,
              totalDue: (c.totalDue || 0) + finalDueAmount,
              totalPurchases: (c.totalPurchases || 0) + totalAmount,
              lastTransactionDate: nowIso,
            };
          }
          return c;
        })
      );
    }

    // Step 5: Save Sale record
    setSales((prev) => [newSale, ...prev]);
    setLastSale(newSale);
    clearCart();

    return { success: true, sale: newSale };
  };

  // Update Invoice Date
  const updateSaleDate = useCallback((saleId: string, newDateIso: string) => {
    const validIso = new Date(newDateIso).toISOString();
    setSales((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          const updatedItems = s.items.map((it) => ({ ...it, createdAt: validIso }));
          return { ...s, createdAt: validIso, items: updatedItems };
        }
        return s;
      })
    );
    setLastSale((prev) => {
      if (prev && prev.id === saleId) {
        return {
          ...prev,
          createdAt: validIso,
          items: prev.items.map((it) => ({ ...it, createdAt: validIso })),
        };
      }
      return prev;
    });
  }, []);

  // Update Sale details
  const updateSale = useCallback((saleId: string, updates: Partial<Sale>) => {
    setSales((prev) => {
      const existingSale = prev.find((s) => s.id === saleId);
      if (!existingSale) return prev;

      const updatedSale = { ...existingSale, ...updates };

      // Adjust customer totalDue & totalPurchases if needed
      if (existingSale.customerId) {
        const dueDiff = (updatedSale.dueAmount ?? existingSale.dueAmount) - existingSale.dueAmount;
        const totalDiff = (updatedSale.totalAmount ?? existingSale.totalAmount) - existingSale.totalAmount;

        if (dueDiff !== 0 || totalDiff !== 0) {
          setCustomers((currCustomers) =>
            currCustomers.map((c) => {
              if (c.id === existingSale.customerId) {
                return {
                  ...c,
                  totalDue: Math.max(0, (c.totalDue || 0) + dueDiff),
                  totalPurchases: Math.max(0, (c.totalPurchases || 0) + totalDiff),
                  updatedAt: new Date().toISOString(),
                };
              }
              return c;
            })
          );
        }
      }

      return prev.map((s) => (s.id === saleId ? updatedSale : s));
    });
    setLastSale((prev) => (prev && prev.id === saleId ? { ...prev, ...updates } : prev));
  }, []);

  // Delete Sale
  const deleteSale = useCallback((saleId: string) => {
    setSales((prev) => {
      const saleToDelete = prev.find((s) => s.id === saleId);
      if (!saleToDelete) return prev;

      // Record tombstone to prevent deleted item from ever reappearing on Google Sheets pull
      recordDeletedId([saleToDelete.id, saleToDelete.invoiceNumber || '']);

      // 1. Restore product stock
      setProducts((currentProducts) => {
        const updatedProducts = [...currentProducts];
        saleToDelete.items.forEach((item) => {
          const productIndex = updatedProducts.findIndex((p) => p.id === item.productId);
          if (productIndex !== -1) {
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              currentStock: (updatedProducts[productIndex].currentStock || 0) + (Number(item.quantity) || 0),
              updatedAt: new Date().toISOString(),
            };
          }
        });
        return updatedProducts;
      });

      // 2. Reduce customer due and total purchases if there was any customer
      if (saleToDelete.customerId) {
        setCustomers((currentCustomers) => {
          const updatedCustomers = [...currentCustomers];
          const cIndex = updatedCustomers.findIndex((c) => c.id === saleToDelete.customerId);
          if (cIndex !== -1) {
            updatedCustomers[cIndex] = {
              ...updatedCustomers[cIndex],
              totalDue: Math.max(0, (updatedCustomers[cIndex].totalDue || 0) - (saleToDelete.dueAmount || 0)),
              totalPurchases: Math.max(0, (updatedCustomers[cIndex].totalPurchases || 0) - (saleToDelete.totalAmount || 0)),
              updatedAt: new Date().toISOString(),
            };
          }
          return updatedCustomers;
        });
      }

      return prev.filter((s) => s.id !== saleId);
    });
    setLastSale((prev) => (prev && prev.id === saleId ? null : prev));
  }, []);

  // 5. Product Management
  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: generateId('PRD'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => {
      const prod = prev.find((p) => p.id === id);
      if (prod) {
        recordDeletedId([prod.id, prod.barcode || '']);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const restockProduct = useCallback((id: string, addedQty: number, newPurchasePrice?: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            currentStock: p.currentStock + addedQty,
            purchasePrice: newPurchasePrice !== undefined && newPurchasePrice > 0 ? newPurchasePrice : p.purchasePrice,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  }, []);

  // 6. Customer & Due Payment Management
  const addCustomer = useCallback(
    (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalDue' | 'totalPurchases'>): Customer => {
      const newCustomer: Customer = {
        ...customerData,
        id: generateId('CST'),
        totalDue: 0,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    },
    []
  );

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => {
      const cust = prev.find((c) => c.id === id);
      if (cust) {
        recordDeletedId([cust.id, cust.phone || '']);
      }
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const receiveCustomerPayment = async ({
    customerId,
    amount,
    paymentMethod,
    trxId,
    note,
  }: {
    customerId: string;
    amount: number;
    paymentMethod: 'Cash' | 'bKash' | 'Nagad';
    trxId?: string;
    note?: string;
  }): Promise<{ success: boolean; payment?: Payment; error?: string }> => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) {
      return { success: false, error: 'Customer not found' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than 0' };
    }

    const prevDue = cust.totalDue || 0;
    const remainingDue = Math.max(0, prevDue - amount);
    const nowIso = new Date().toISOString();

    const newPayment: Payment = {
      id: generateId('PAY'),
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      amount,
      paymentMethod,
      trxId,
      note,
      previousDue: prevDue,
      remainingDue,
      createdAt: nowIso,
    };

    // Update Customer Due
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              totalDue: remainingDue,
              lastTransactionDate: nowIso,
            }
          : c
      )
    );

    // Save Payment Log
    setPayments((prev) => [newPayment, ...prev]);

    return { success: true, payment: newPayment };
  };

  const deletePayment = useCallback((id: string) => {
    setPayments((prev) => {
      const pay = prev.find((p) => p.id === id);
      if (pay) {
        recordDeletedId([pay.id, pay.trxId || '']);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // 7. Expense Management
  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: generateId('EXP'),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    recordDeletedId(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // 8. Settings & Google Sheets Operations
  const updateSettings = useCallback((newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const connectGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setSettings((prev) => ({ ...prev, syncStatus: 'syncing' }));
      // Clear any token without sheets scopes
      if (!GoogleSheetsService.getToken()) {
        GoogleSheetsService.disconnect();
      }
      try {
        await GoogleSheetsService.requestAuth();
      } catch (gisErr) {
        console.warn('GIS auth failed, trying Firebase Google Sign In:', gisErr);
        await googleSignIn(true);
      }
      setIsGoogleConnected(true);
      setSettings((prev) => ({ ...prev, syncStatus: 'synced', syncError: undefined }));
      return { success: true, message: 'Google Sheets অ্যাকাউন্ট সফলভাবে কানেক্ট করা হয়েছে!' };
    } catch (err: any) {
      setSettings((prev) => ({ ...prev, syncStatus: 'error', syncError: err?.message }));
      return { success: false, message: err?.message || 'Google অ্যাকাউন্ট অনুমোদন করা সম্ভব হয়নি' };
    }
  };

  const createNewGoogleSheetDatabase = async (forceNew: boolean = false): Promise<{ success: boolean; message: string; url?: string }> => {
    try {
      setSettings((prev) => ({ ...prev, syncStatus: 'syncing' }));

      // If a spreadsheet is already connected and forceNew is false, sync to existing one instead of duplicate file creation
      if (!forceNew && settings.spreadsheetId) {
        const syncRes = await syncWithGoogleSheets(settings.spreadsheetId);
        if (syncRes.success) {
          return {
            success: true,
            message: 'ইতোমধ্যে সংযুক্ত গুগল শিট ডাটাবেজের সাথে ডাটা সফলভাবে সিঙ্ক করা হয়েছে!',
            url: settings.spreadsheetUrl,
          };
        }
      }
      
      // If valid sheets token not present, request authorization directly
      if (!GoogleSheetsService.getToken()) {
        GoogleSheetsService.disconnect();
        try {
          await GoogleSheetsService.requestAuth();
        } catch (gisErr) {
          console.warn('GIS auth failed, trying Firebase Google Sign In with sheets scope:', gisErr);
          await googleSignIn(true);
        }
      }

      let result;
      try {
        result = await GoogleSheetsService.createStoreDatabase(settings.shopName);
      } catch (initialErr: any) {
        const isScopeOrAuthErr =
          initialErr?.message?.toLowerCase().includes('scope') ||
          initialErr?.message?.toLowerCase().includes('auth') ||
          initialErr?.message?.toLowerCase().includes('401') ||
          initialErr?.message?.toLowerCase().includes('403');

        if (isScopeOrAuthErr) {
          console.warn('Scopes missing or expired, requesting fresh Google Sheets permission...');
          GoogleSheetsService.disconnect();
          try {
            await GoogleSheetsService.requestAuth();
          } catch (gisErr) {
            await googleSignIn(true);
          }
          // Retry once with fresh permission
          result = await GoogleSheetsService.createStoreDatabase(settings.shopName);
        } else {
          throw initialErr;
        }
      }
      
      // Immediately populate full dataset
      const syncRes = await GoogleSheetsService.syncAllData(result.id, {
        products,
        sales,
        customers,
        payments,
        expenses,
        settings: { ...settings, spreadsheetId: result.id, spreadsheetUrl: result.url },
      });

      if (syncRes.success) {
        setSettings((prev) => ({
          ...prev,
          spreadsheetId: result.id,
          spreadsheetUrl: result.url,
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString(),
          syncError: undefined,
        }));
        setIsGoogleConnected(true);
        return { success: true, message: 'আপনার গুগল ড্রাইভে নতুন গুগল শিট ডাটাবেজ তৈরি এবং সমস্ত ডাটা সিঙ্ক সম্পন্ন হয়েছে!', url: result.url };
      } else {
        throw new Error(syncRes.message);
      }
    } catch (err: any) {
      setSettings((prev) => ({ ...prev, syncStatus: 'error', syncError: err?.message }));
      return { success: false, message: err?.message || 'গুগল শিট ডাটাবেজ তৈরিতে সমস্যা হয়েছে' };
    }
  };

  const pullFromGoogleSheets = async (sheetId?: string): Promise<{ success: boolean; message: string }> => {
    const targetSheetId = sheetId || settings.spreadsheetId;
    if (!targetSheetId) {
      return { success: false, message: 'Google Sheet ID পাওয়া যায়নি' };
    }

    try {
      setSettings((prev) => ({ ...prev, syncStatus: 'syncing' }));

      // Check auth token or perform background silent refresh
      let token = await GoogleSheetsService.getValidTokenOrRefresh(false);
      if (!token) {
        try {
          token = await GoogleSheetsService.requestAuth(undefined, true);
        } catch {
          await googleSignIn(true);
        }
      }

      const res = await GoogleSheetsService.fetchDataFromGoogleSheets(targetSheetId);
      if (res.success && res.data) {
        // Smart bi-directional merge: prevents duplicates AND prevents any data loss
        const mergedProds = mergeProducts(products, res.data.products || []);
        const mergedSales = mergeSales(sales, res.data.sales || []);
        const mergedCusts = mergeCustomers(customers, res.data.customers || []);
        const mergedPays = mergePayments(payments, res.data.payments || []);
        const mergedExps = mergeExpenses(expenses, res.data.expenses || []);

        setProducts(mergedProds);
        setSales(mergedSales);
        setCustomers(mergedCusts);
        setPayments(mergedPays);
        setExpenses(mergedExps);

        const updatedSettings: StoreSettings = {
          ...settings,
          ...(res.data.settings || {}),
          spreadsheetId: targetSheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetSheetId}/edit`,
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString(),
          syncError: undefined,
        };
        setSettings(updatedSettings);
        setIsGoogleConnected(true);

        // Immediate background write-back of merged data so cloud spreadsheet is also 100% deduplicated & synchronized
        GoogleSheetsService.syncAllData(targetSheetId, {
          products: mergedProds,
          sales: mergedSales,
          customers: mergedCusts,
          payments: mergedPays,
          expenses: mergedExps,
          settings: updatedSettings,
        }).catch((syncErr) => console.warn('Background write-back sync after pull:', syncErr));

        return { success: true, message: 'গুগল শিট থেকে ডাটা ডুপ্লিকেট ছাড়া সঠিকভাবে মার্জ ও সিঙ্ক করা হয়েছে!' };
      } else {
        setSettings((prev) => ({ ...prev, syncStatus: 'error', syncError: res.message }));
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      setSettings((prev) => ({ ...prev, syncStatus: 'error', syncError: err?.message }));
      return { success: false, message: err?.message || 'ডাটা লোড করতে সমস্যা হয়েছে' };
    }
  };

  const syncWithGoogleSheets = async (sheetId?: string): Promise<{ success: boolean; message: string }> => {
    const targetSheetId = sheetId || settings.spreadsheetId;
    if (!targetSheetId) {
      return { success: false, message: 'No Google Sheet ID configured. Please create or connect one first.' };
    }

    try {
      setSettings((prev) => ({ ...prev, syncStatus: 'syncing' }));

      // Ensure valid auth token before performing sync
      let token = await GoogleSheetsService.getValidTokenOrRefresh(false);
      if (!token) {
        try {
          token = await GoogleSheetsService.requestAuth(undefined, true);
        } catch {
          await googleSignIn(true);
        }
      }

      // If connecting a new sheet from another device (or sheetId provided explicitly),
      // merge existing cloud sheet data with local data first so nothing is lost
      if (sheetId && sheetId !== settings.spreadsheetId) {
        const pullRes = await GoogleSheetsService.fetchDataFromGoogleSheets(targetSheetId);
        if (pullRes.success && pullRes.data) {
          const mergedProds = mergeProducts(products, pullRes.data.products || []);
          const mergedSales = mergeSales(sales, pullRes.data.sales || []);
          const mergedCusts = mergeCustomers(customers, pullRes.data.customers || []);
          const mergedPays = mergePayments(payments, pullRes.data.payments || []);
          const mergedExps = mergeExpenses(expenses, pullRes.data.expenses || []);

          setProducts(mergedProds);
          setSales(mergedSales);
          setCustomers(mergedCusts);
          setPayments(mergedPays);
          setExpenses(mergedExps);

          const newSettings: StoreSettings = {
            ...settings,
            spreadsheetId: targetSheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetSheetId}/edit`,
            syncStatus: 'synced',
            lastSyncTime: new Date().toISOString(),
            syncError: undefined,
          };
          setSettings(newSettings);
          setIsGoogleConnected(true);

          await GoogleSheetsService.syncAllData(targetSheetId, {
            products: mergedProds,
            sales: mergedSales,
            customers: mergedCusts,
            payments: mergedPays,
            expenses: mergedExps,
            settings: newSettings,
          });

          return { success: true, message: 'বিদ্যমান গুগল শিট ডাটাবেজের সাথে সফলভাবে কানেক্ট ও ডাটা ডুপ্লিকেট ছাড়া মার্জ হয়েছে!' };
        }
      }

      const res = await GoogleSheetsService.syncAllData(targetSheetId, {
        products,
        sales,
        customers,
        payments,
        expenses,
        settings: { ...settings, spreadsheetId: targetSheetId },
      });

      if (res.success) {
        setSettings((prev) => ({
          ...prev,
          spreadsheetId: targetSheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetSheetId}/edit`,
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString(),
          syncError: undefined,
        }));
        setIsGoogleConnected(true);
        return { success: true, message: 'গুগল শিটে সমস্ত ডাটা সফলভাবে সংরক্ষিত হয়েছে!' };
      } else {
        setSettings((prev) => ({ ...prev, syncStatus: 'error', syncError: res.message }));
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      setSettings((prev) => ({ ...prev, syncStatus: 'error', syncError: err?.message }));
      return { success: false, message: err?.message || 'Sync failed' };
    }
  };

  const disconnectGoogleSheets = () => {
    GoogleSheetsService.disconnect();
    setIsGoogleConnected(false);
    setSettings((prev) => ({
      ...prev,
      syncStatus: 'disconnected',
      syncError: undefined,
    }));
  };

  // --- Authentication Actions ---
  const signInWithGmail = async (email: string, password?: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      setTimeout(() => {
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          return resolve({ success: false, error: 'অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' });
        }
        if (password && found.password !== password) {
          return resolve({ success: false, error: 'পাসওয়ার্ড ভুল হয়েছে।' });
        }
        const { password: _, ...safeUser } = found;
        setCurrentUser(safeUser);
        resolve({ success: true });
      }, 500);
    });
  };

  const signUpWithGmail = async (params: {
    name: string;
    email: string;
    password?: string;
    shopName: string;
    phone?: string;
  }) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      setTimeout(() => {
        const exists = users.find((u) => u.email.toLowerCase() === params.email.toLowerCase());
        if (exists) {
          return resolve({ success: false, error: 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে।' });
        }

        const newUser: StoredUserAccount = {
          id: `user-${Date.now()}`,
          name: params.name,
          email: params.email.toLowerCase(),
          shopName: params.shopName,
          phone: params.phone,
          password: params.password,
          createdAt: new Date().toISOString(),
        };

        setUsers((prev) => [...prev, newUser]);
        
        const { password: _, ...safeUser } = newUser;
        setCurrentUser(safeUser);
        resolve({ success: true });
      }, 500);
    });
  };

  const isGmailAddress = (addr?: string): boolean => {
    if (!addr) return false;
    const clean = addr.trim().toLowerCase();
    return clean.endsWith('@gmail.com') && clean.length > 10;
  };

  const signInWithGoogleOneClick = async (email?: string, name?: string) => {
    return new Promise<{ success: boolean; error?: string; isFallback?: boolean }>(async (resolve) => {
      let userEmail = (email && isGmailAddress(email)) ? email.toLowerCase() : 'arafatshuvo941@gmail.com';
      let userName = name || 'দোকানদার';

      try {
        // 1. Attempt Google OAuth Sign In (Standard profile and email)
        const authResult = await googleSignIn(false);
        if (authResult.accessToken) {
          setIsGoogleConnected(true);
        }
        
        if (authResult.user.email) {
          userEmail = authResult.user.email.toLowerCase();
        }
        if (authResult.user.displayName) {
          userName = authResult.user.displayName;
        }
      } catch (err: any) {
        console.warn('Firebase Google Auth encountered an error, falling back to direct login:', err);
      }

      // 2. Find or Create User in local state
      const found = users.find((u) => u.email.toLowerCase() === userEmail);
      const activeUser: StoredUserAccount = found || {
        id: `user-${Date.now()}`,
        name: userName,
        email: userEmail,
        shopName: 'আমার ব্যবসা',
        createdAt: new Date().toISOString(),
      };

      if (!found) {
        setUsers((prev) => [...prev, activeUser]);
      }
      
      const { password: _, ...safeUser } = activeUser;
      setCurrentUser(safeUser);

      resolve({ success: true });
    });
  };

  const clearDatabase = useCallback(async () => {
    clearAllDeletedIds();
    if (settings.spreadsheetId) {
      try {
        await GoogleSheetsService.clearAllSpreadsheetData(settings.spreadsheetId);
      } catch (e) {
        console.warn('Could not clear spreadsheet remotely:', e);
      }
    }
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setPayments([]);
    setExpenses([]);
    setCart([]);
    setLastSale(null);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    window.location.reload();
  }, [settings.spreadsheetId]);

  const signOut = () => {
    firebaseLogout();
    setCurrentUser(null);
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        signInWithGmail,
        signUpWithGmail,
        signInWithGoogleOneClick,
        signOut,
        clearDatabase,
        products,
        sales,
        customers,
        payments,
        expenses,
        settings,
        metrics,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartItemPrice,
        clearCart,
        processSale,
        updateSaleDate,
        updateSale,
        deleteSale,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        receiveCustomerPayment,
        deletePayment,
        addExpense,
        deleteExpense,
        updateSettings,
        syncWithGoogleSheets,
        pullFromGoogleSheets,
        connectGoogleSheets,
        createNewGoogleSheetDatabase,
        disconnectGoogleSheets,
        isGoogleConnected,
        language,
        setLanguage,
        t,
        activeTab,
        setActiveTab,
        lastSale,
        setLastSale,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
