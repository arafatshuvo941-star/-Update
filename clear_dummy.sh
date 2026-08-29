#!/bin/bash
cat << 'INNER_EOF' > src/services/mockInitialData.ts
import { Product, Customer, Sale, Payment, Expense, StoreSettings } from '../types';

export const INITIAL_SETTINGS: StoreSettings = {
  shopName: 'বিসমিল্লাহ জেনারেল ও মেডিসিন স্টোর',
  shopOwner: 'মোঃ শফিকুল ইসলাম',
  shopPhone: '01712-345678',
  shopAddress: 'মেইন রোড, থানা মোড়, ঢাকা',
  shopTagline: 'ন্যায্য মূল্যে খাঁটি পণ্য ও ঔষধের বিশ্বস্ত প্রতিষ্ঠান',
  currency: '৳',
  language: 'bn',
  syncStatus: 'idle',
};

export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
INNER_EOF
