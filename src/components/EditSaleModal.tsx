import React, { useState } from 'react';
import { Sale, SaleItem, PaymentMethod } from '../types';
import { useStore } from '../context/StoreContext';
import {
  formatTaka,
  toDateTimeLocalValue,
  toIsoDateString,
} from '../utils/formatters';
import {
  X,
  Check,
  Trash2,
  Calendar,
  User,
  CreditCard,
  AlertTriangle,
  Receipt,
  Plus,
  Minus,
  Edit2,
} from 'lucide-react';

interface EditSaleModalProps {
  sale: Sale;
  onClose: () => void;
  onDeleted?: () => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({ sale, onClose, onDeleted }) => {
  const { products, customers, updateSale, deleteSale, updateProduct } = useStore();

  // Basic Form States
  const [customerName, setCustomerName] = useState(sale.customerName);
  const [customerPhone, setCustomerPhone] = useState(sale.customerPhone || '');
  const [dateTime, setDateTime] = useState(() => toDateTimeLocalValue(sale.createdAt));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale.paymentMethod);
  const [paymentDetails, setPaymentDetails] = useState(sale.paymentDetails || '');
  
  // Items State (copy of items)
  const [items, setItems] = useState<SaleItem[]>(() => JSON.parse(JSON.stringify(sale.items)));
  const [discount, setDiscount] = useState<string>(String(sale.discount || 0));
  const [paidAmount, setPaidAmount] = useState<string>(String(sale.paidAmount || 0));
  
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
  const totalProfit = items.reduce((acc, it) => acc + it.profit, 0);
  const numDiscount = Math.max(0, Number(discount) || 0);
  const totalAmount = Math.max(0, subtotal - numDiscount);
  const numPaid = Math.min(totalAmount, Math.max(0, Number(paidAmount) || 0));
  const dueAmount = Math.max(0, totalAmount - numPaid);

  const handleItemQtyChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const singleProfit = item.salePrice - item.purchasePrice;
      item.quantity = newQty;
      item.totalPrice = newQty * item.salePrice;
      item.profit = newQty * singleProfit;
      return updated;
    });
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      item.salePrice = newPrice;
      item.totalPrice = item.quantity * newPrice;
      item.profit = item.quantity * (newPrice - item.purchasePrice);
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('বিক্রির চালানে কমপক্ষে ১টি পণ্য থাকতে হবে। সম্পূর্ণ বিক্রি মুছতে চাইলে নিচে "বিক্রি মুছুন" ব্যবহার করুন।');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const validIso = dateTime ? new Date(dateTime).toISOString() : sale.createdAt;

    // Adjust product inventory differences
    sale.items.forEach((originalItem) => {
      const updatedItem = items.find((it) => it.productId === originalItem.productId);
      const prod = products.find((p) => p.id === originalItem.productId);
      if (prod) {
        if (!updatedItem) {
          // Item was removed, restore full quantity to stock
          updateProduct(prod.id, { currentStock: (prod.currentStock || 0) + originalItem.quantity });
        } else if (updatedItem.quantity !== originalItem.quantity) {
          // Quantity changed
          const diff = originalItem.quantity - updatedItem.quantity;
          updateProduct(prod.id, { currentStock: (prod.currentStock || 0) + diff });
        }
      }
    });

    // Check if new items were added (if applicable)
    items.forEach((newItem) => {
      const originalItem = sale.items.find((it) => it.productId === newItem.productId);
      if (!originalItem) {
        const prod = products.find((p) => p.id === newItem.productId);
        if (prod) {
          updateProduct(prod.id, { currentStock: Math.max(0, (prod.currentStock || 0) - newItem.quantity) });
        }
      }
    });

    const updatedSaleData: Partial<Sale> = {
      customerName: customerName.trim() || 'সাধারণ ক্রেতা',
      customerPhone: customerPhone.trim() || undefined,
      subtotal,
      discount: numDiscount,
      totalAmount,
      paidAmount: paymentMethod === 'Due' ? 0 : numPaid,
      dueAmount: paymentMethod === 'Due' ? totalAmount : dueAmount,
      paymentMethod,
      paymentDetails: paymentDetails.trim() || undefined,
      totalProfit: Math.max(0, totalProfit - numDiscount),
      itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
      items: items.map((it) => ({ ...it, createdAt: validIso })),
      createdAt: validIso,
    };

    updateSale(sale.id, updatedSaleData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleDelete = () => {
    deleteSale(sale.id);
    if (onDeleted) onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 my-4">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">বিক্রয় চালান সম্পাদনা (Edit Sale)</h3>
              <p className="text-[10px] text-slate-400 font-mono">মেমো: {sale.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>চালান সফলভাবে আপডেট করা হয়েছে!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. Customer Details & Date */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>ক্রেতার তথ্য ও তারিখ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">ক্রেতার নাম</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">ইনভয়েস তারিখ ও সময়</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Items List */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>পণ্যের বিবরণ ও দাম</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">মোট {items.length} আইটেম</span>
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">একক: {item.unit}</p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleItemQtyChange(idx, item.quantity - 1)}
                      className="p-1 text-slate-600 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemQtyChange(idx, Number(e.target.value) || 1)}
                      className="w-12 text-center p-1 font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleItemQtyChange(idx, item.quantity + 1)}
                      className="p-1 text-slate-600 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      min="0"
                      value={item.salePrice}
                      onChange={(e) => handleItemPriceChange(idx, Number(e.target.value) || 0)}
                      className="w-full text-right p-1 font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      title="বিক্রয় মূল্য"
                    />
                  </div>

                  {/* Remove item */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                    title="আইটেম মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Payment & Totals */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>পেমেন্ট মাধ্যম ও হিসাব</span>
            </h4>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'bKash', 'Nagad', 'Due'] as PaymentMethod[]).map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(pm);
                    if (pm === 'Due') setPaidAmount('0');
                    else if (pm === 'Cash' || pm === 'bKash' || pm === 'Nagad') {
                      if (paidAmount === '0') setPaidAmount(String(totalAmount));
                    }
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === pm
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pm === 'Cash' ? 'নগদ (Cash)' : pm === 'Due' ? 'বাকি (Due)' : pm}
                </button>
              ))}
            </div>

            {/* Discount & Paid Amount */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">ছাড় / ডিসকাউন্ট (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">পরিশোধিত টাকা (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Summary Box */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>সাবটোটাল:</span>
                <span className="font-mono font-semibold">{formatTaka(subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm pt-1">
                <span>সর্বমোট বিল:</span>
                <span className="font-mono text-emerald-600">{formatTaka(totalAmount)}</span>
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded-lg">
                  <span>বাকি ব্যালেন্স:</span>
                  <span className="font-mono">{formatTaka(dueAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delete Sale Confirmation Section */}
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl">
            {isConfirmingDelete ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>আপনি কি এই সম্পূর্ণ বিক্রির চালানটি মুছে ফেলতে চান? পণ্যের স্টক ফেরত যাবে।</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
                  >
                    না, বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, বিক্রি মুছুন</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                  ভুল বিক্রি হয়েছে? এই রেকর্ড মুছতে চান?
                </span>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>চালান মুছুন (Delete)</span>
                </button>
              </div>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>পরিবর্তন সেভ করুন (Save Changes)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
