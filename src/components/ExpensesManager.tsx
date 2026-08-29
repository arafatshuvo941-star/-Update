import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Expense, ExpenseCategory } from '../types';
import { formatTaka, formatBdDateTime, isToday, isThisMonth } from '../utils/formatters';
import {
  ReceiptText,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Coffee,
  Zap,
  Truck,
  Building,
  UserCheck,
  Package,
  X,
} from 'lucide-react';

const EXPENSE_CATEGORIES: { label: string; value: ExpenseCategory; icon: any }[] = [
  { label: 'চা ও নাস্তা (Snacks & Tea)', value: 'Snacks & Tea', icon: Coffee },
  { label: 'বিদ্যুৎ বিল (Electricity)', value: 'Electricity', icon: Zap },
  { label: 'পরিবহন ভাড়া (Transport)', value: 'Transport', icon: Truck },
  { label: 'দোকান ভাড়া (Shop Rent)', value: 'Rent', icon: Building },
  { label: 'কর্মচারী বেতন (Staff Salary)', value: 'Staff Salary', icon: UserCheck },
  { label: 'দোকানের মালামাল / পলিথিন', value: 'Shop Supplies', icon: Package },
  { label: 'অন্যান্য খরচ (Other)', value: 'Other', icon: ReceiptText },
];

export const ExpensesManager: React.FC = () => {
  const { expenses, addExpense, deleteExpense, t } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Snacks & Tea');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad'>('Cash');
  const [note, setNote] = useState('');

  // Calculations
  const todayTotal = useMemo(() => {
    return expenses
      .filter((e) => isToday(e.createdAt))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const monthTotal = useMemo(() => {
    return expenses
      .filter((e) => isThisMonth(e.createdAt))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!title.trim() || !numAmount || numAmount <= 0) return;

    addExpense({
      title: title.trim(),
      category,
      amount: numAmount,
      paymentMethod,
      note: note.trim() || undefined,
    });

    setTitle('');
    setAmount('');
    setNote('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Banner with Today & Monthly Expense Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Header */}
        <div className="sm:col-span-2 bg-gradient-to-r from-amber-800 to-amber-700 text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">
              দোকানের দৈনন্দিন খরচ (Daily Expenses)
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-1 font-mono tracking-tight">
              আজকের খরচ: {formatTaka(todayTotal)}
            </h3>
            <p className="text-xs text-amber-100 mt-0.5">
              চলতি মাসের মোট খরচ: {formatTaka(monthTotal)}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-amber-900 hover:bg-amber-50 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all active:scale-98 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addExpense')}</span>
          </button>
        </div>

        {/* Quick Monthly Card */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500">চলতি মাসের খরচ</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {formatTaka(monthTotal)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">মোট {expenses.length} টি এন্ট্রি</span>
        </div>
      </div>

      {/* Expenses Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-amber-600" />
            <span>খরচের রেকর্ড তালিকা</span>
          </h3>
          <span className="text-xs text-slate-500">{expenses.length} টি খরচ রেকর্ড</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              কোনো খরচ এন্ট্রি নেই
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                      {exp.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {exp.category}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700">
                      {exp.paymentMethod}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{formatBdDateTime(exp.createdAt)}</span>
                    {exp.note && <span>• {exp.note}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-black text-rose-700 text-sm sm:text-base">
                    -{formatTaka(exp.amount)}
                  </span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <ReceiptText className="w-4 h-4 text-amber-600" />
                <span>নতুন খরচ এন্ট্রি</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('expenseTitle')} (Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: দুপুরের নাস্তা / দোকান ভাড়া / পলিথিন ব্যাগ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('expenseCategory')} (Category) *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('expenseAmount')} *
                </label>
                <input
                  type="number" step="any"
                  min="0"
                  required
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono font-black text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">পরিশোধ মাধ্যম *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Cash', 'bKash', 'Nagad'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                        paymentMethod === m
                          ? 'bg-amber-700 text-white border-amber-700'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m === 'Cash' ? 'নগদ' : m === 'bKash' ? 'বিকাশ' : 'নগদ'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="অতিরিক্ত কোনো তথ্য"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs"
                >
                  {t('saveExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
