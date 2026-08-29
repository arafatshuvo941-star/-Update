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
  const [showConfirmNewSheet, setShowConfirmNewSheet] = useState(false);
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

  const handleCreateNewDatabase = async (force: boolean = false) => {
    // If already connected and not confirmed, prompt user
    if (settings.spreadsheetId && !force) {
      setShowConfirmNewSheet(true);
      return;
    }

    setShowConfirmNewSheet(false);
    setIsBusy(true);
    setStatusMessage(null);
    try {
      const res = await createNewGoogleSheetDatabase(true);
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

  const handleRenewAuth = async () => {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      await GoogleSheetsService.requestAuth();
      const res = await syncWithGoogleSheets();
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'গুগল সেশন সফলভাবে রিনিউ ও ডাটা সিঙ্ক হয়েছে!' });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'লগইন সেশন রিনিউ করতে সমস্যা হয়েছে' });
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

        {/* Confirmation Modal for Creating Duplicate Sheet */}
        {showConfirmNewSheet && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">সতর্কতা: আপনার অলরেডি একটি ডাটাবেজ শিট কানেক্ট করা আছে!</p>
                <p className="text-[11px]">
                  আপনি কি নিশ্চিত যে বর্তমান শিটটি পরিবর্তন করে আপনার গুগল ড্রাইভে <b>সম্পূর্ণ নতুন আরেকটি শিট</b> তৈরি করতে চান?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmNewSheet(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewDatabase(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                হ্যাঁ, নতুন শিট তৈরি করুন
              </button>
            </div>
          </div>
        )}

        {/* Connection Status Overview */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">কানেকশন স্ট্যাটাস:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                settings.spreadsheetId
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
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
            <div className="space-y-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">সংযুক্ত শিট আইডি:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[200px]">
                  {settings.spreadsheetId}
                </span>
              </div>
              {settings.spreadsheetUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">গুগল শিট ফাইল:</span>
                  <a
                    href={settings.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>গুগল ড্রাইভে ফাইল খুলুন</span>
                  </a>
                </div>
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

        {/* Action Controls */}
        <div className="space-y-2.5 pt-2">
          {settings.spreadsheetId ? (
            /* IF CONNECTED: Show Sync & Pull Controls */
            <div className="space-y-2">
              {(!GoogleSheetsService.getToken() || settings.syncStatus === 'needs_auth') && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>গুগল সেশন এক্সপায়ার হয়েছে</span>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleRenewAuth}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    সেশন রিনিউ করুন (১-ক্লিক)
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  id="btn-pull-sheets-data"
                  disabled={isBusy}
                  onClick={handlePullFromSheets}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="গুগল শিট থেকে নতুন ডাটা লোড করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>📥 শিট থেকে ডাটা আনুন (Pull)</span>
                </button>

                <button
                  id="btn-push-sheets-data"
                  disabled={isBusy}
                  onClick={handleSyncNow}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="ফোন থেকে শিটে সর্বশেষ হিসাব সিঙ্ক করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>📤 শিটে ডাটা পাঠান (Push)</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmNewSheet(true)}
                  className="text-[11px] text-slate-500 hover:text-emerald-700 underline font-medium cursor-pointer"
                >
                  + সম্পূর্ণ নতুন আরেকটি শিট তৈরি করতে চান?
                </button>
                <button
                  onClick={disconnectGoogleSheets}
                  className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  ডিসকানেক্ট
                </button>
              </div>
            </div>
          ) : (
            /* IF NOT CONNECTED: Show Create Database & Connect Controls */
            <div className="space-y-2.5">
              <button
                id="btn-create-sheets-db"
                disabled={isBusy}
                onClick={() => handleCreateNewDatabase(false)}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {isBusy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>১-ক্লিকে নতুন Google Sheets ডাটাবেজ তৈরি করুন</span>
              </button>

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
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  কানেক্ট
                </button>
              </form>
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
