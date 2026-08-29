import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Settings as SettingsIcon,
  Store,
  Phone,
  MapPin,
  Tag,
  Globe,
  Download,
  Upload,
  X,
  CheckCircle2, Trash2,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, products, sales, customers, payments, expenses, language, clearDatabase, setLanguage, t } = useStore();

  const [shopName, setShopName] = useState(settings.shopName || '');
  const [shopOwner, setShopOwner] = useState(settings.shopOwner || '');
  const [shopPhone, setShopPhone] = useState(settings.shopPhone || '');
  const [shopAddress, setShopAddress] = useState(settings.shopAddress || '');
  const [shopTagline, setShopTagline] = useState(settings.shopTagline || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName: shopName.trim(),
      shopOwner: shopOwner.trim(),
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      shopTagline: shopTagline.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportBackup = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      products,
      sales,
      customers,
      payments,
      expenses,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `store_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 my-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                দোকানের তথ্য ও সেটিংস
              </h3>
              <p className="text-xs text-slate-500">মেমো ও রশিদে প্রদর্শিত দোকান প্রোফাইল</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>তথ্য সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              দোকানের নাম (Shop Name) *
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">স্বত্বাধিকারী (Owner)</label>
              <input
                type="text"
                value={shopOwner}
                onChange={(e) => setShopOwner(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">মোবাইল নম্বর *</label>
              <input
                type="text"
                required
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">দোকানের ঠিকানা (Address)</label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">স্লোগান / মেমো ফুটার নোট</label>
            <input
              type="text"
              value={shopTagline}
              onChange={(e) => setShopTagline(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Language preference */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">অ্যাপের ভাষা (Language)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  language === 'bn'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                বাংলা (Bengali)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Theme preference */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">অ্যাপের থিম (App Theme)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  theme === 'light'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                লাইট (Light)
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                ডার্ক (Dark)
              </button>
            </div>
          </div>

          {/* Clear Database Action */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {isConfirmingClear ? (
              <div className="flex flex-col gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-xl">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 text-center">আপনি কি নিশ্চিত? সমস্ত ডাটা মুছে যাবে!</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsConfirmingClear(false)} className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-bold transition-colors">না, বাতিল করুন</button>
                  <button type="button" onClick={() => { clearDatabase(); onClose(); }} className="flex-1 py-1.5 bg-rose-600 text-white rounded text-xs font-bold transition-colors">হ্যাঁ, নিশ্চিত</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="w-full py-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সমস্ত ডাটা মুছে ফেলুন (Factory Reset)</span>
              </button>
            )}
          </div>

          {/* Backup Action */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>লোকাল ডাটা ব্যাকআপ ডাউনলোড (JSON)</span>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
