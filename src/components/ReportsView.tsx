import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  formatTaka,
  isToday,
  isYesterday,
  isThisMonth,
  isSameDay,
  formatBdDate,
  formatBdDateTime,
  toIsoDateString,
} from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  Printer,
  Calendar,
  Share2,
  CheckCircle2,
  DollarSign,
  Receipt,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react';
import { Product, Sale } from '../types';
import { ReceiptModal } from './ReceiptModal';
import { EditSaleModal } from './EditSaleModal';

type ReportPeriod = 'today' | 'yesterday' | '7days' | 'thisMonth' | 'custom';

export const ReportsView: React.FC = () => {
  const { sales, products, customers, expenses, settings, restockProduct, deleteSale, t } = useStore();

  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return toIsoDateString(yesterday);
  });
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [restockProductItem, setRestockProductItem] = useState<Product | null>(null);
  const [restockCount, setRestockCount] = useState('10');

  // Helper date objects
  const yesterdayDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  // Filter Sales based on Selected Period
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      if (period === 'today') return isToday(saleDate);
      if (period === 'yesterday') return isYesterday(saleDate);
      if (period === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return saleDate >= sevenDaysAgo;
      }
      if (period === 'thisMonth') return isThisMonth(saleDate);
      if (period === 'custom') {
        return isSameDay(saleDate, new Date(customDate));
      }
      return true;
    });
  }, [sales, period, customDate]);

  // Filter Expenses based on Selected Period
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = new Date(e.createdAt);
      if (period === 'today') return isToday(expDate);
      if (period === 'yesterday') return isYesterday(expDate);
      if (period === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return expDate >= sevenDaysAgo;
      }
      if (period === 'thisMonth') return isThisMonth(expDate);
      if (period === 'custom') {
        return isSameDay(expDate, new Date(customDate));
      }
      return true;
    });
  }, [expenses, period, customDate]);

  // Summary Metrics for Active Period
  const periodSalesTotal = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [filteredSales]);

  const periodProfitTotal = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalProfit, 0);
  }, [filteredSales]);

  const periodExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const periodNetProfit = periodProfitTotal - periodExpensesTotal;

  // Monthly & General Totals
  const monthlySales = useMemo(() => {
    return sales.filter((s) => isThisMonth(s.createdAt)).reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales]);

  const totalDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  }, [customers]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  }, [products]);

  // Low Stock Items
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStock);
  }, [products]);

  // Top Customers with Due
  const dueCustomers = useMemo(() => {
    return customers.filter((c) => (c.totalDue || 0) > 0).sort((a, b) => b.totalDue - a.totalDue);
  }, [customers]);

  // Payment Breakdown for Active Period
  const paymentBreakdown = useMemo(() => {
    const counts = { Cash: 0, bKash: 0, Nagad: 0, Due: 0, Split: 0 };
    const amounts = { Cash: 0, bKash: 0, Nagad: 0, Due: 0, Split: 0 };

    filteredSales.forEach((s) => {
      if (s.paymentMethod in counts) {
        counts[s.paymentMethod as keyof typeof counts] += 1;
        amounts[s.paymentMethod as keyof typeof amounts] += s.totalAmount;
      }
    });

    return { counts, amounts };
  }, [filteredSales]);

  // 7-day Sales & Profit Chart Data
  const chartData = useMemo(() => {
    const daysMap: Record<string, { date: string; sales: number; profit: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      daysMap[key] = { date: label, sales: 0, profit: 0 };
    }

    sales.forEach((s) => {
      const key = s.createdAt.split('T')[0];
      if (daysMap[key]) {
        daysMap[key].sales += s.totalAmount;
        daysMap[key].profit += s.totalProfit;
      }
    });

    return Object.values(daysMap);
  }, [sales]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductItem) return;
    const qty = Number(restockCount) || 0;
    if (qty > 0) {
      restockProduct(restockProductItem.id, qty);
    }
    setRestockProductItem(null);
  };

  // Period display text
  const periodLabel = useMemo(() => {
    if (period === 'today') return `আজকের (${formatBdDate(new Date())})`;
    if (period === 'yesterday') return `গতকাল (${formatBdDate(yesterdayDate)})`;
    if (period === '7days') return 'বিগত ৭ দিনের';
    if (period === 'thisMonth') return 'চলতি মাসের';
    if (period === 'custom') return `${formatBdDate(new Date(customDate))} তারিখের`;
    return 'হিসাব';
  }, [period, yesterdayDate, customDate]);

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>হিসাব ও রিপোর্ট (Reports & Analytics)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            তারিখভিত্তিক ও মাসিক বিক্রি, লাভ, খরচ, বকেয়া বাকি এবং মজুদের সামগ্রিক চিত্র
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>রিপোর্ট প্রিন্ট করুন</span>
        </button>
      </div>

      {/* Date & Period Filter Selector Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">রিপোর্ট ফিল্টার করুন:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Today */}
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'today'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            আজকে ({formatBdDate(new Date())})
          </button>

          {/* Yesterday (27 Aug) */}
          <button
            onClick={() => setPeriod('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'yesterday'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            গতকাল ({formatBdDate(yesterdayDate)})
          </button>

          {/* Last 7 Days */}
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === '7days'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            বিগত ৭ দিন
          </button>

          {/* This Month */}
          <button
            onClick={() => setPeriod('thisMonth')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'thisMonth'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            চলতি মাস
          </button>

          {/* Custom Date Input */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setPeriod('custom');
              }}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all outline-none ${
                period === 'custom'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 4 Core Summary Cards for the Selected Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Period Sales */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold text-slate-500">{periodLabel} মোট বিক্রি</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono block mt-1">
            {formatTaka(periodSalesTotal)}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 inline-block">
            {filteredSales.length} টি বিক্রি রসিদ
          </span>
        </div>

        {/* Period Profit */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold text-slate-500">{periodLabel} মোট লাভ</span>
          <span className="text-xl sm:text-2xl font-black text-teal-700 font-mono block mt-1">
            {formatTaka(periodProfitTotal)}
          </span>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 inline-block">
            নিট লাভ: <strong>{formatTaka(periodNetProfit)}</strong>{' '}
            {periodExpensesTotal > 0 && `(খরচ: ${formatTaka(periodExpensesTotal)})`}
          </span>
        </div>

        {/* Total Outstanding Due */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold text-slate-500">মোট বকেয়া পাওনা</span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono block mt-1">
            {formatTaka(totalDue)}
          </span>
          <span className="text-[11px] text-rose-500 font-medium mt-0.5 inline-block">
            {dueCustomers.length} জন গ্রাহকের বাকি
          </span>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold text-slate-500">বর্তমান দোকানের স্টক মূল্য</span>
          <span className="text-xl sm:text-2xl font-black text-indigo-700 font-mono block mt-1">
            {formatTaka(totalStockValue)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 inline-block">
            {products.length} টি মালামাল আইটেম
          </span>
        </div>
      </div>

      {/* Selected Period's Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {periodLabel} বিক্রয় চালান ও ভাউচার তালিকা ({filteredSales.length} টি)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
            মোট: {formatTaka(periodSalesTotal)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              এই নির্বাচিত সময়ে কোনো বিক্রির রেকর্ড নেই
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div
                  onClick={() => setSelectedSale(sale)}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
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
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-mono">{sale.invoiceNumber}</span>
                    <span>•</span>
                    <span>{sale.itemsCount} টি পণ্য</span>
                    <span>•</span>
                    <span>{formatBdDateTime(sale.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div
                    onClick={() => setSelectedSale(sale)}
                    className="text-left sm:text-right cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-mono block">
                      {formatTaka(sale.totalAmount)}
                    </span>
                    <span className="text-[11px] font-semibold text-teal-700 block">
                      লাভ: {formatTaka(sale.totalProfit)}
                    </span>
                  </div>

                  {/* Actions: View Receipt, Edit, Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-xs flex items-center gap-1"
                      title="রশিদ দেখুন (View Invoice)"
                    >
                      <Receipt className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingSale(sale)}
                      className="p-1.5 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/40 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold"
                      title="বিক্রি চালান এডিট করুন"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {deletingSaleId === sale.id ? (
                      <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 p-1 rounded-lg">
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">মুছবেন?</span>
                        <button
                          type="button"
                          onClick={() => setDeletingSaleId(null)}
                          className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-bold rounded"
                        >
                          না
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteSale(sale.id);
                            setDeletingSaleId(null);
                          }}
                          className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded"
                        >
                          হ্যাঁ
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingSaleId(sale.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs"
                        title="বিক্রি মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sales & Profit Chart (Recharts) */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>বিগত ৭ দিনের বিক্রি ও লাভের চিত্র (Sales & Profit Trends)</span>
        </h3>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, '']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sales" name="বিক্রি (Sales ৳)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="লাভ (Profit ৳)" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Section: Low Stock Products & Due Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Low Stock Alert Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-amber-950 text-sm">
                কম মজুদের পণ্য (অর্ডার প্রয়োজন)
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
              {lowStockProducts.length} টি
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>সকল পণ্যের পর্যাপ্ত স্টক মজুদ আছে</span>
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div key={prod.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 dark:bg-slate-900">
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{prod.name}</h5>
                    <span className="text-[11px] text-slate-500 font-mono">
                      মজুদ: <strong className="text-amber-700">{prod.currentStock} {prod.unit}</strong> (কমপক্ষে: {prod.minStock})
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setRestockProductItem(prod);
                      setRestockCount('10');
                    }}
                    className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    + স্টক আনুন
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Outstanding Due Customers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-700" />
              <h3 className="font-bold text-rose-950 text-sm">
                শীর্ষ বাকি কাস্টমার তালিকা
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-800 bg-rose-200 px-2 py-0.5 rounded-full">
              {dueCustomers.length} জন
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
            {dueCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>কোনো কাস্টমারের বাকি নেই!</span>
              </div>
            ) : (
              dueCustomers.slice(0, 6).map((c) => (
                <div key={c.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 dark:bg-slate-900">
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{c.name}</h5>
                    <span className="text-[11px] text-slate-500 font-mono">{c.phone}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-rose-700 font-mono block">
                      {formatTaka(c.totalDue)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      কেনাকাটা: {formatTaka(c.totalPurchases)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RESTOCK MODAL */}
      {restockProductItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-xl space-y-3 animate-in fade-in">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              স্টক যোগ করুন - {restockProductItem.name}
            </h3>
            <form onSubmit={handleSaveRestock} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  নতুন পরিমাণ ({restockProductItem.unit}) *
                </label>
                <input
                  type="number" step="any"
                  min="0"
                  required
                  value={restockCount}
                  onChange={(e) => setRestockCount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestockProductItem(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  স্টক সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Sale Invoice Modal */}
      {selectedSale && (
        <ReceiptModal
          sale={sales.find((s) => s.id === selectedSale.id) || selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}

      {/* Edit Sale Modal */}
      {editingSale && (
        <EditSaleModal
          sale={sales.find((s) => s.id === editingSale.id) || editingSale}
          onClose={() => setEditingSale(null)}
          onDeleted={() => setEditingSale(null)}
        />
      )}
    </div>
  );
};
