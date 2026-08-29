import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
  formatTaka,
  formatBdDateTime,
  formatBdDate,
  isToday,
  isYesterday,
  isSameDay,
  toIsoDateString,
} from '../utils/formatters';
import {
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Receipt,
  Users,
  ReceiptText,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { Sale } from '../types';

export const Dashboard: React.FC = () => {
  const { metrics, sales, products, customers, expenses, setActiveTab, t } = useStore();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Selected Date Filter State (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDateString(new Date()));

  // Determine active target date object
  const activeDate = useMemo(() => {
    if (!selectedDate) return new Date();
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [selectedDate]);

  // Filter Sales for Active Date
  const activeDateSalesList = useMemo(() => {
    return sales.filter((s) => isSameDay(s.createdAt, activeDate));
  }, [sales, activeDate]);

  const activeDateSalesTotal = useMemo(() => {
    return activeDateSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [activeDateSalesList]);

  const activeDateProfitTotal = useMemo(() => {
    return activeDateSalesList.reduce((sum, s) => sum + s.totalProfit, 0);
  }, [activeDateSalesList]);

  // Filter Expenses for Active Date
  const activeDateExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => isSameDay(e.createdAt, activeDate))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, activeDate]);

  const activeDateNetProfit = activeDateProfitTotal - activeDateExpensesTotal;

  // Filter low stock products
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStock);

  // Label helpers
  const isViewingToday = isToday(activeDate);
  const activeDateFormatted = formatBdDate(activeDate);

  const activePeriodLabel = isViewingToday
    ? 'আজকের'
    : `${activeDateFormatted}`;

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Sleek 1-Line Header: Title, Calendar Date Picker & New Sale Button */}
      <div className="bg-white dark:bg-slate-800 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-2">
        {/* Left: Icon, Title & Date Picker in ONE Single Line */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight shrink-0">
              {t('shopManagement')}
            </h2>
            <div className="relative flex items-center group">
              <div className="text-xs font-bold px-2 py-1.5 bg-slate-50 dark:bg-slate-900 group-hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors">
                <span className="whitespace-nowrap">{activeDateFormatted}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <input
                id="input-dashboard-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="তারিখ নির্বাচন করুন"
              />
            </div>
            {!isViewingToday && (
              <button
                onClick={() => setSelectedDate(toIsoDateString(new Date()))}
                className="p-1 px-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors text-[10px] font-bold flex items-center gap-0.5 cursor-pointer shrink-0"
                title="আজকের তারিখে ফিরুন"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">আজকে</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Sale Action Button */}
        <button
          id="btn-dashboard-new-sale"
          onClick={() => setActiveTab('sales')}
          className="flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">নতুন বিক্রি করুন</span>
          <span className="sm:hidden">বিক্রি</span>
        </button>
      </div>

      {/* 4 Core Primary Metric Cards (Dynamically calculated for the selected date) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Selected Date's Sales */}
        <div
          id="card-today-sales"
          onClick={() => setActiveTab('sales')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              {activePeriodLabel} {t('todaySales')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight block">
              {formatTaka(activeDateSalesTotal)}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 mt-0.5 inline-block">
              {activeDateSalesList.length} {t('itemsSold')}
            </span>
          </div>
        </div>

        {/* 2. Selected Date's Profit */}
        <div
          id="card-today-profit"
          onClick={() => setActiveTab('reports')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              {activePeriodLabel} {t('todayProfit')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-teal-700 font-mono tracking-tight block">
              {formatTaka(activeDateProfitTotal)}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 inline-block">
              {t('netProfit')}: {formatTaka(activeDateNetProfit)}{' '}
              {activeDateExpensesTotal > 0 && `(খরচ: ${formatTaka(activeDateExpensesTotal)})`}
            </span>
          </div>
        </div>

        {/* 3. Total Due (মোট বাকি) */}
        <div
          id="card-total-due"
          onClick={() => setActiveTab('customers')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">{t('totalDue')}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono tracking-tight block">
              {formatTaka(metrics.totalDue)}
            </span>
            <span className="text-[11px] font-medium text-rose-500 mt-0.5 inline-block">
              {customers.filter((c) => c.totalDue > 0).length} জন কাস্টমারের বাকি
            </span>
          </div>
        </div>

        {/* 4. Current Stock */}
        <div
          id="card-current-stock"
          onClick={() => setActiveTab('products')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">{t('currentStock')}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight block">
              {products.length} টি পণ্য
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 inline-block">
              মূল্য: {formatTaka(metrics.totalStockValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any item is below minimum threshold */}
      {lowStockItems.length > 0 && (
        <div
          onClick={() => setActiveTab('products')}
          className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-amber-900 cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm">
                মজুদ সতর্কবার্তা: {lowStockItems.length} টি পণ্যের স্টক কম!
              </span>
              <span className="text-xs text-amber-700 ml-2 hidden sm:inline">
                ({lowStockItems.slice(0, 3).map((p) => p.name).join(', ')}...)
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-1 rounded-lg shrink-0">
            স্টক দেখুন →
          </span>
        </div>
      )}

      {/* Quick Shortcuts Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {t('quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-900 transition-colors text-left font-bold text-xs sm:text-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span>নতুন বিক্রি (Sale)</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors text-left font-bold text-xs sm:text-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <span>পণ্য যোগ (Product)</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-900 transition-colors text-left font-bold text-xs sm:text-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span>বাকি জমা (Payment)</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-900 transition-colors text-left font-bold text-xs sm:text-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4" />
            </div>
            <span>দোকান খরচ (Expense)</span>
          </button>
        </div>
      </div>

      {/* Selected Date's Sales Activity List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {activePeriodLabel} বিক্রির তালিকা ({activeDateSalesList.length} টি)
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            {t('viewAll')} রিপোর্ট →
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activeDateSalesList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-1.5">
              <Receipt className="w-8 h-8 text-slate-300" />
              <span>{activeDateFormatted} তারিখে কোনো বিক্রির রেকর্ড পাওয়া যায়নি</span>
              <button
                onClick={() => setSelectedDate(toIsoDateString(new Date()))}
                className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                আজকের বিক্রি দেখুন →
              </button>
            </div>
          ) : (
            activeDateSalesList.map((sale) => (
              <div
                key={sale.id}
                onClick={() => setSelectedSale(sale)}
                className="p-3.5 sm:p-4 hover:bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {sale.customerName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sale.paymentMethod === 'bKash'
                          ? 'bg-pink-100 text-pink-700'
                          : sale.paymentMethod === 'Nagad'
                          ? 'bg-orange-100 text-orange-700'
                          : sale.paymentMethod === 'Due'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{sale.invoiceNumber}</span>
                    <span>•</span>
                    <span>{sale.itemsCount} টি আইটেম</span>
                    <span>•</span>
                    <span>{formatBdDateTime(sale.createdAt)}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-mono block">
                    {formatTaka(sale.totalAmount)}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-700 block">
                    লাভ: {formatTaka(sale.totalProfit)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Receipt Modal */}
      {selectedSale && (
        <ReceiptModal
          sale={sales.find((s) => s.id === selectedSale.id) || selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
