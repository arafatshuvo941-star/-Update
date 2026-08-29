import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { GoogleSheetsService } from '../services/googleSheetsService';
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Plus,
  Link2,
  AlertCircle,
  X,
  Table,
  Layers,
  Database,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface GoogleSheetsModalProps {
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ onClose }) => {
  const {
    settings,
    products,
    sales,
    customers,
    payments,
    expenses,
    syncWithGoogleSheets,
    pullFromGoogleSheets,
    connectGoogleSheets,
    createNewGoogleSheetDatabase,
    disconnectGoogleSheets,
    isGoogleConnected,
  } = useStore();

  const [inputSheetId, setInputSheetId] = useState(settings.spreadsheetId || '');
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sheetsOverview = [
    { name: 'Products', count: products.length, desc: 'পণ্য তালিকা, দাম ও বর্তমান স্টক' },
    { name: 'Sales', count: sales.length, desc: 'বিক্রির ইনভয়েস, কাস্টমার ও মোট বিল' },
    { name: 'SaleItems', count: sales.reduce((acc, s) => acc + s.items.length, 0), desc: 'প্রতিটি বিক্রিত পণ্যের আইটেম রেকর্ড' },
    { name: 'Customers', count: customers.length, desc: 'কাস্টমার তালিকা ও বকেয়া বাকি' },
    { name: 'Payments', count: payments.length, desc: 'বাকি আদায়ের জমা রেকর্ড ও হিসাব' },
    { name: 'Expenses', count: expenses.length, desc: 'দোকানের দৈনন্দিন খরচ তালিকা' },
    { name: 'Settings', count: 6, desc: 'দোকানের নাম, ঠিকানা ও কনফিগারেশন' },
  ];

  const handleCreateNewDatabase = async () => {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const res = await createNewGoogleSheetDatabase();
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to create Google Sheet database' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSheetId.trim()) return;

    // Extract ID if a full URL was pasted
    let cleanId = inputSheetId.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      cleanId = match[1];
    }

    setIsBusy(true);
    setStatusMessage(null);
    try {
      const res = await syncWithGoogleSheets(cleanId);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to sync with Google Sheet' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleSyncNow = async () => {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const res = await syncWithGoogleSheets();
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Sync failed' });
    } finally {
      setIsBusy(false);
    }
  };

  const handlePullFromSheets = async () => {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const res = await pullFromGoogleSheets();
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to pull data' });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 my-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Google Sheets ডাটাবেজ ইন্টিগ্রেশন
              </h3>
              <p className="text-[11px] text-slate-500">
                ক্লাউড ডাটাবেজ হিসেবে গুগল শিট ব্যবহার ও স্বয়ংক্রিয় ব্যাকআপ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Connection Status Overview */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">কানেকশন স্ট্যাটাস:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                settings.spreadsheetId
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700 dark:text-slate-300'
              }`}
            >
              {settings.spreadsheetId ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheets কানেক্টেড</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span>লোকাল স্টোরেজ মোড (অফলাইন সক্রিয়)</span>
                </>
              )}
            </span>
          </div>

          {settings.spreadsheetId && (
            <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">শিট আইডি:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[200px]">
                  {settings.spreadsheetId}
                </span>
              </div>
              {settings.spreadsheetUrl && (
                <a
                  href={settings.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 mt-1 text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>গুগল শিটে ডাটাবেজ ফাইল খুলুন</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* 7 Tables Architecture List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>স্বতন্ত্র ৭টি শিট টেবিল স্ট্রাকচার (Clean Modular Database):</span>
          </h4>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {sheetsOverview.map((sh) => (
              <div key={sh.name} className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>📄 {sh.name}</span>
                  <span className="text-emerald-700 font-mono">{sh.count} টি</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{sh.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* 1. Create New Database in Google Drive */}
          <button
            id="btn-create-sheets-db"
            disabled={isBusy}
            onClick={handleCreateNewDatabase}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            {isBusy ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>১-ক্লিকে নতুন Google Sheets ডাটাবেজ তৈরি করুন</span>
          </button>

          {/* 2. Or Connect Existing Sheet ID */}
          <form onSubmit={handleConnectExisting} className="flex gap-2">
            <input
              type="text"
              placeholder="অথবা বিদ্যমান গুগল শিটের লিংক বা ID দিন..."
              value={inputSheetId}
              onChange={(e) => setInputSheetId(e.target.value)}
              className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isBusy || !inputSheetId.trim()}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
            >
              কানেক্ট
            </button>
          </form>

          {/* Sync & Pull Buttons if already connected */}
          {settings.spreadsheetId && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  disabled={isBusy}
                  onClick={handlePullFromSheets}
                  className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  title="গুগল শিট থেকে নতুন পণ্য ও বিক্রির ডাটা ফোনে লোড করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>গুগল শিট থেকে ফোনে ডাটা লোড করুন (Pull)</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={isBusy}
                  onClick={handleSyncNow}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>ফোন থেকে শিটে ডাটা পাঠান (Push)</span>
                </button>
                <button
                  onClick={disconnectGoogleSheets}
                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ডিসকানেক্ট
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Connection Helper Note */}
        <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] text-blue-800 dark:text-blue-200 space-y-1">
          <p className="font-bold">📱 মোবাইল ফোনে ডাটাবেজ কানেক্ট করার নিয়ম:</p>
          <p className="text-blue-700 dark:text-blue-300">
            কম্পিউটারে তৈরি করা আপনার গুগল শিটের লিংকটি কপি করে মোবাইলে উপরের <b>"বিদ্যমান গুগল শিটের লিংক বা ID দিন"</b> বক্সে পেস্ট করে <b>"কানেক্ট"</b> চাপুন। সাথে সাথে আপনার দোকানের সমস্ত পণ্য ও হিসাব মোবাইলে চলে আসবে!
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
