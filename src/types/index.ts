export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Due' | 'Split';

export type ProductCategory =
  | 'Medicine'
  | 'Grocery'
  | 'Gas Cylinder'
  | 'Mobile Load'
  | 'Stationery'
  | 'Beverages'
  | 'Snacks'
  | 'Personal Care'
  | 'General Retail'
  | 'Other';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory | string;
  unit: string; // pcs, kg, ltr, strip, box, pkt, cyl
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  barcode?: string;
  expiryDate?: string;
  extraInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  total: number;
  profit: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  totalPrice: number;
  profit: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: string;
  totalProfit: number;
  itemsCount: number;
  items: SaleItem[];
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalDue: number;
  totalPurchases: number;
  createdAt: string;
  lastTransactionDate?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad';
  trxId?: string;
  note?: string;
  previousDue: number;
  remainingDue: number;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Snacks & Tea'
  | 'Staff Salary'
  | 'Transport'
  | 'Maintenance'
  | 'Shop Supplies'
  | 'Other';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad';
  note?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string; // Must be @gmail.com
  shopName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface StoreSettings {
  shopName: string;
  shopOwner: string;
  shopPhone: string;
  shopAddress: string;
  shopTagline: string;
  customCategories?: string[];
  deletedCategories?: string[];
  currency: string;
  language: 'en' | 'bn';
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastSyncTime?: string;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'disconnected' | 'needs_auth';
  syncError?: string;
}

export interface DashboardMetrics {
  todaySales: number;
  todayProfit: number;
  todaySalesCount: number;
  totalDue: number;
  totalStockCount: number;
  totalStockValue: number;
  lowStockCount: number;
  todayExpenses: number;
  netTodayProfit: number;
}
