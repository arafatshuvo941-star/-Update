import React, { useState } from 'react';
import { Sale } from '../types';
import { useStore } from '../context/StoreContext';
import {
  formatTaka,
  formatBdDateTime,
  toDateTimeLocalValue,
  toIsoDateString,
} from '../utils/formatters';
import {
  Printer,
  Share2,
  X,
  CheckCircle,
  Calendar,
  Edit3,
  Check,
  Trash2,
  Edit,
} from 'lucide-react';
import { EditSaleModal } from './EditSaleModal';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { settings, updateSaleDate, deleteSale, t } = useStore();
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isEditingSale, setIsEditingSale] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editedDateTime, setEditedDateTime] = useState(() =>
    toDateTimeLocalValue(sale.createdAt)
  );
  const [dateSavedMessage, setDateSavedMessage] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const itemsList = sale.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productName} x${it.quantity} (${it.unit}) = ${formatTaka(it.totalPrice)}`
      )
      .join('\n');

    const text = `*${settings.shopName}*\n${settings.shopAddress || ''}\nফোন: ${settings.shopPhone || ''}\n--------------------------\n*ক্যাশ মেমো / রশিদ*\nমেমো নং: ${sale.invoiceNumber}\nতারিখ: ${formatBdDateTime(sale.createdAt)}\nক্রেতা: ${sale.customerName} ${sale.customerPhone ? `(${sale.customerPhone})` : ''}\n--------------------------\n${itemsList}\n--------------------------\nসাবটোটাল: ${formatTaka(sale.subtotal)}\nছাড়: ${formatTaka(sale.discount)}\n*সর্বমোট: ${formatTaka(sale.totalAmount)}*\nপরিশোধ (${sale.paymentMethod}): ${formatTaka(sale.paidAmount)}\n${sale.dueAmount > 0 ? `*বাকি: ${formatTaka(sale.dueAmount)}*` : 'বকেয়া: নেই (পরিশোধিত)'}\n--------------------------\n${settings.shopTagline || 'ধন্যবাদ, আবার আসবেন!'}`;

    const url = `https://wa.me/${sale.customerPhone ? sale.customerPhone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveDate = () => {
    if (!editedDateTime) return;
    const newIso = new Date(editedDateTime).toISOString();
    updateSaleDate(sale.id, newIso);
    setIsEditingDate(false);
    setDateSavedMessage(true);
    setTimeout(() => setDateSavedMessage(false), 2500);
  };

  const setPresetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setEditedDateTime(toDateTimeLocalValue(d));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div
        id="receipt-modal-card"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 my-4"
      >
        {/* Modal Top Action Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">{t('saleSuccess')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Changed Banner Alert */}
        {dateSavedMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ইনভয়েস তারিখ সফলভাবে পরিবর্তন করা হয়েছে!</span>
          </div>
        )}

        {/* Date Editor Drawer / Inline form */}
        {isEditingDate && (
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                ইনভয়েস তারিখ ও সময় পরিবর্তন করুন:
              </span>
              <button
                onClick={() => setIsEditingDate(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-400"
              >
                বাতিল
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPresetDate(0)}
                className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
              >
                আজকে (Today)
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(1)}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg cursor-pointer"
              >
                গতকাল (Yesterday - 27 Aug)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={editedDateTime ? editedDateTime.split('T')[0] : toIsoDateString(new Date())}
                  onChange={(e) => {
                    const d = e.target.value;
                    const t = editedDateTime ? (editedDateTime.split('T')[1] || '12:00') : '12:00';
                    if (d) setEditedDateTime(`${d}T${t}`);
                  }}
                  className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  title="ক্যালেন্ডার থেকে তারিখ বেছে নিন"
                />
              </div>

              <div className="relative flex items-center">
                <input
                  type="time"
                  value={editedDateTime ? (editedDateTime.split('T')[1] || '12:00').slice(0, 5) : '12:00'}
                  onChange={(e) => {
                    const t = e.target.value;
                    const d = editedDateTime ? editedDateTime.split('T')[0] : toIsoDateString(new Date());
                    if (t) setEditedDateTime(`${d}T${t}`);
                  }}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  title="সময় পরিবর্তন করুন"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingDate(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveDate}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>তারিখ পরিবর্তন সেভ করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Memo Content */}
        <div id="printable-receipt" className="p-5 text-slate-800 dark:text-slate-200 text-sm bg-white dark:bg-slate-800">
          {/* Shop Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-600">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {settings.shopName || 'Universal Store'}
            </h2>
            {settings.shopTagline && (
              <p className="text-[11px] text-slate-500 italic mt-0.5">{settings.shopTagline}</p>
            )}
            {settings.shopAddress && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{settings.shopAddress}</p>
            )}
            {settings.shopPhone && (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">মোবাইল: {settings.shopPhone}</p>
            )}
          </div>

          {/* Memo Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-600 text-xs space-y-1">
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-500">মেমো নং (Invoice No):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ইনভয়েস তারিখ (Invoice Date):</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">{formatBdDateTime(sale.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => setIsEditingDate(!isEditingDate)}
                  title="ইনভয়েস তারিখ পরিবর্তন করুন"
                  className="no-print p-0.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ক্রেতার নাম (Customer):</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{sale.customerName}</span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">মোবাইল (Phone):</span>
                <span className="text-slate-700 dark:text-slate-300">{sale.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-600">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                  <th className="text-left pb-1.5">বিবরণ (Item)</th>
                  <th className="text-center pb-1.5">পরিমাণ</th>
                  <th className="text-right pb-1.5">দর</th>
                  <th className="text-right pb-1.5">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1.5 pr-1 font-medium text-slate-800 dark:text-slate-200 max-w-[140px] truncate">
                      {item.productName}
                    </td>
                    <td className="py-1.5 text-center text-slate-600 dark:text-slate-400">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-1.5 text-right text-slate-600 dark:text-slate-400 font-mono">
                      {formatTaka(item.salePrice)}
                    </td>
                    <td className="py-1.5 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatTaka(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="py-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>সাবটোটাল (Subtotal):</span>
              <span className="font-mono font-medium">{formatTaka(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>ছাড় (Discount):</span>
                <span className="font-mono">-{formatTaka(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>সর্বমোট বিল (Grand Total):</span>
              <span className="font-mono text-emerald-700">{formatTaka(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300 pt-1">
              <span>
                পরিশোধ ({sale.paymentMethod}
                {sale.paymentDetails ? ` - ${sale.paymentDetails}` : ''}):
              </span>
              <span className="font-mono font-semibold">{formatTaka(sale.paidAmount)}</span>
            </div>
            {sale.dueAmount > 0 ? (
              <div className="flex justify-between text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded-sm">
                <span>বাকি টাকা (Due Balance):</span>
                <span className="font-mono">{formatTaka(sale.dueAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-emerald-700 font-semibold text-[11px]">
                <span>বকেয়া স্ট্যাটাস:</span>
                <span>সম্পূর্ণ পরিশোধিত (Paid)</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 dark:border-slate-600 text-[11px] text-slate-500">
            <p className="font-medium text-slate-700 dark:text-slate-300">ধন্যবাদ, আবার আসবেন!</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Universal Store POS Bangladesh</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <button
            id="btn-print-receipt"
            onClick={handlePrint}
            className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট</span>
          </button>

          <button
            id="btn-whatsapp-receipt"
            onClick={handleWhatsAppShare}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            id="btn-edit-receipt"
            onClick={() => setIsEditingSale(true)}
            className="flex items-center justify-center gap-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="সম্পূর্ণ চালান সম্পাদনা / পরিবর্তন করুন"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>এডিট</span>
          </button>

          {isConfirmingDelete ? (
            <div className="flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950 p-1 rounded-xl">
              <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">মুছবেন?</span>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="py-1 px-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-bold"
              >
                না
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSale(sale.id);
                  onClose();
                }}
                className="py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold"
              >
                হ্যাঁ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="flex items-center justify-center gap-1 py-2 px-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
              title="বিক্রয় চালান মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছুন</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            বন্ধ
          </button>
        </div>
      </div>

      {/* Edit Sale Modal */}
      {isEditingSale && (
        <EditSaleModal
          sale={sale}
          onClose={() => setIsEditingSale(false)}
          onDeleted={() => {
            setIsEditingSale(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
