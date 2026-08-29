import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Customer } from '../types';
import { formatTaka, formatBdDateTime } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  CreditCard,
  Phone,
  MapPin,
  Clock,
  ArrowDownLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Plus,
} from 'lucide-react';

export const CustomersManager: React.FC = () => {
  const {
    customers,
    payments,
    sales,
    addCustomer,
    updateCustomer,
    receiveCustomerPayment,
    settings,
    t,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);

  // Add / Edit Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Receive Payment Modal
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'bKash' | 'Nagad'>('Cash');
  const [trxId, setTrxId] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  // Customer History Modal
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Total Outstanding Due
  const totalOutstandingDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  }, [customers]);

  const dueCustomersCount = useMemo(() => {
    return customers.filter((c) => (c.totalDue || 0) > 0).length;
  }, [customers]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q));

      const matchesDue = !filterDueOnly || (c.totalDue || 0) > 0;
      return matchesSearch && matchesDue;
    });
  }, [customers, searchQuery, filterDueOnly]);

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setIsCustomerModalOpen(true);
  };

  const openEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address || '');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });
    } else {
      addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });
    }
    setIsCustomerModalOpen(false);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;

    const res = await receiveCustomerPayment({
      customerId: paymentCustomer.id,
      amount,
      paymentMethod: payMethod,
      trxId: trxId.trim() || undefined,
      note: payNote.trim() || undefined,
    });

    if (res.success) {
      setPaySuccessMsg(`৳${amount} টাকা জমা নেওয়া হয়েছে এবং বাকি আপডেট হয়েছে!`);
      setTimeout(() => {
        setPaySuccessMsg(null);
        setPaymentCustomer(null);
        setPayAmount('');
        setTrxId('');
        setPayNote('');
      }, 1400);
    }
  };

  // WhatsApp Reminder Generator
  const handleSendReminder = (customer: Customer) => {
    const text = `আসসালামু আলাইকুম ${customer.name} সাহেব,\n*${settings.shopName}* থেকে বিনীতভাবে জানাচ্ছি যে আপনার পূর্বের বকেয়া বাকি আছে *${formatTaka(customer.totalDue)}*।\nদয়া করে সুবিধাজনক সময়ে পরিশোধ করবেন।\nআমাদের সাথে যোগাযোগের নম্বর: ${settings.shopPhone || ''} (বিকাশ/নগদ প্রযোজ্য)।\nধন্যবাদ!`;

    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Header & Total Due Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Due Banner */}
        <div className="sm:col-span-2 bg-gradient-to-r from-rose-800 to-rose-700 text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-200 uppercase tracking-wider block">
              কাস্টমার বাকি খাতা (Due Ledger)
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-1 font-mono tracking-tight">
              মোট বকেয়া: {formatTaka(totalOutstandingDue)}
            </h3>
            <p className="text-xs text-rose-100 mt-0.5">
              {dueCustomersCount} জন কাস্টমারের কাছে পাওনা বাকি রয়েছে
            </p>
          </div>

          <button
            onClick={openAddCustomer}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-rose-800 hover:bg-rose-50 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all active:scale-98 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('addCustomer')}</span>
          </button>
        </div>

        {/* Quick Filter toggle card */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-center gap-2">
          <span className="text-xs font-bold text-slate-500">মোট কাস্টমার তালিকা</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {customers.length} জন
            </span>
            <button
              onClick={() => setFilterDueOnly(!filterDueOnly)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterDueOnly
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {filterDueOnly ? 'শুধুমাত্র বাকি কাস্টমার' : 'সবাইকে দেখুন'}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="input-search-customers"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="{t('customerName')}, ফোন নম্বর বা এলাকা দিয়ে {t('search')}"
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">কোনো কাস্টমার পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">নতুন কাস্টমার যোগ করুন</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const hasDue = (cust.totalDue || 0) > 0;

            return (
              <div
                key={cust.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border flex flex-col justify-between transition-all shadow-xs ${
                  hasDue ? 'border-rose-200 hover:border-rose-300' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600'
                }`}
              >
                <div>
                  {/* Top Bar with Name & Due Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {cust.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </p>
                    </div>

                    {/* Due Badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                          hasDue ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {hasDue ? `বাকি: ${formatTaka(cust.totalDue)}` : 'বাকি নেই'}
                      </span>
                    </div>
                  </div>

                  {cust.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{cust.address}</span>
                    </p>
                  )}

                  {/* Purchases stats */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>মোট কেনাকাটা: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatTaka(cust.totalPurchases)}</strong></span>
                    {cust.lastTransactionDate && (
                      <span className="truncate">শেষ লেনদেন: {new Date(cust.lastTransactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  {/* Receive Payment Button */}
                  <button
                    onClick={() => {
                      setPaymentCustomer(cust);
                      setPayAmount(cust.totalDue > 0 ? cust.totalDue.toString() : '');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                      hasDue
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                    title={hasDue ? 'বকেয়া টাকা জমা নিন' : 'বাকি নেই (অগ্রিম বা জমা)'}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>{hasDue ? 'বাকি জমা নিন' : 'টাকা জমা'}</span>
                  </button>

                  {/* Send Reminder Button */}
                  {hasDue && (
                    <button
                      onClick={() => handleSendReminder(cust)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 dark:text-slate-400 hover:text-emerald-700 rounded-xl transition-colors"
                      title="হোয়াটসঅ্যাপে বাকি তাগাদা পাঠান"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* View History Button */}
                  <button
                    onClick={() => setHistoryCustomer(cust)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 rounded-xl transition-colors"
                    title="লেনদেন ইতিহাস"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Customer */}
                  <button
                    onClick={() => openEditCustomer(cust)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 rounded-xl transition-colors"
                    title="কাস্টমার তথ্য সংশোধন"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RECEIVE PAYMENT (টাকা জমা নিন) MODAL */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{t('receivePayment')}</span>
              </h3>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">কাস্টমার:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{paymentCustomer.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">বর্তমান বকেয়া বাকি:</span>
                <span className={`font-mono font-bold ${paymentCustomer.totalDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {paymentCustomer.totalDue > 0 ? formatTaka(paymentCustomer.totalDue) : '৳০ (বাকি নেই)'}
                </span>
              </div>
            </div>

            {paymentCustomer.totalDue <= 0 && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                💡 <strong>তথ্য:</strong> এই কাস্টমারের পূর্বে কোনো বকেয়া বাকি নেই। আপনি চাইলে অগ্রিম হিসেবে জমা রেকর্ড করতে পারেন।
              </div>
            )}

            {paySuccessMsg ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{paySuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('enterPaymentAmount')} *
                    </label>
                    {paymentCustomer.totalDue > 0 && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPayAmount(String(paymentCustomer.totalDue))}
                          className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded"
                        >
                          সম্পূর্ণ বাকি ({formatTaka(paymentCustomer.totalDue)})
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="number" step="any"
                    min="1"
                    required
                    placeholder="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono font-black text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {paymentCustomer.totalDue > 0 && Number(payAmount) > paymentCustomer.totalDue && (
                    <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                      ⚠️ বকেয়ার চেয়ে বেশি টাকা প্রবেশ করানো হয়েছে।
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('paymentMethod')} *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Cash', 'bKash', 'Nagad'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                          payMethod === m
                            ? m === 'Cash'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : m === 'bKash'
                              ? 'bg-pink-600 text-white border-pink-600'
                              : 'bg-orange-600 text-white border-orange-600'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m === 'Cash' ? t('cash') : m === 'bKash' ? t('bkash') : t('nagad')}
                      </button>
                    ))}
                  </div>
                </div>

                {(payMethod === 'bKash' || payMethod === 'Nagad') && (
                  <input
                    type="text"
                    placeholder="Trx ID / রেফারেন্স"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                  />
                )}

                <input
                  type="text"
                  placeholder="নোট / বিবরণ (ঐচ্ছিক)"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentCustomer(null)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER TRANSACTION HISTORY MODAL */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  {historyCustomer.name} - লেনদেন বিবরণী
                </h3>
                <p className="text-xs text-slate-500 font-mono">{historyCustomer.phone}</p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                পেমেন্ট ও জমা রেকর্ড
              </h4>
              {payments.filter((p) => p.customerId === historyCustomer.id).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">কোনো জমার রেকর্ড নেই</p>
              ) : (
                payments
                  .filter((p) => p.customerId === historyCustomer.id)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-800 font-mono">
                          +{formatTaka(p.amount)}
                        </span>
                        <span className="text-slate-500 text-[11px] ml-2">
                          ({p.paymentMethod} {p.trxId ? `- ${p.trxId}` : ''})
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatBdDateTime(p.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">অবশিষ্ট বাকি</span>
                        <span className="font-mono font-bold text-rose-700">
                          {formatTaka(p.remainingDue)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setHistoryCustomer(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingCustomer ? 'কাস্টমার তথ্য সংশোধন' : 'নতুন কাস্টমার যোগ'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('customerName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ করিম ভাই"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('mobileNumber')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('address')} (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: দক্ষিণ পাড়া / স্কুল রোড"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {editingCustomer ? 'আপডেট করুন' : 'কাস্টমার সেভ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
