import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatBdDate } from '../utils/formatters';
import {
  Store,
  FileSpreadsheet,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  ShoppingBag,
  LogOut,
} from 'lucide-react';
import { GoogleSheetsModal } from './GoogleSheetsModal';
import { SettingsModal } from './SettingsModal';

export const Navbar: React.FC = () => {
  const { settings, t, language, setLanguage, metrics, setActiveTab, currentUser, signOut } = useStore();
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const getSyncBadge = () => {
    switch (settings.syncStatus) {
      case 'syncing':
        return (
          <button
            id="btn-sync-status"
            onClick={() => setShowSheetsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span className="hidden sm:inline">{t('syncingSheets')}</span>
            <span className="sm:hidden">Syncing</span>
          </button>
        );
      case 'synced':
        return (
          <button
            id="btn-sync-status"
            onClick={() => setShowSheetsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
            title={settings.spreadsheetId ? `Connected to Google Sheets: ${settings.spreadsheetId}` : 'Synced'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{t('syncedWithSheets')}</span>
            <span className="sm:hidden">Sheets</span>
          </button>
        );
      case 'error':
        return (
          <button
            id="btn-sync-status"
            onClick={() => setShowSheetsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Sync Error</span>
            <span className="sm:hidden">Error</span>
          </button>
        );
      default:
        return (
          <button
            id="btn-sync-status"
            onClick={() => setShowSheetsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{settings.spreadsheetId ? 'Google Sheets' : t('connectSheets')}</span>
            <span className="sm:hidden">Sheets</span>
          </button>
        );
    }
  };

  return (
    <>
      <header id="main-header" className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Shop branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs cursor-pointer shrink-0"
            >
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {settings.shopName || 'Store Manager'}
              </h1>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                {settings.shopAddress || formatBdDate(new Date())}
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Google Sheets Sync Pill */}
            {getSyncBadge()}

            {/* Language Switcher */}
            <button
              id="btn-lang-toggle"
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
              title="Toggle Language (English / বাংলা)"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Quick POS Button in Header for Desktop */}
            <button
              id="btn-header-pos"
              onClick={() => setActiveTab('sales')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('newSaleBtn')}</span>
            </button>

            {/* Settings Modal Button */}
            <button
              id="btn-open-settings"
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
              title="Shop Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            {/* Logout Button */}
            <button
              id="btn-logout"
              onClick={signOut}
              className="p-1.5 sm:p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="লগ আউট"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      {showSheetsModal && (
        <GoogleSheetsModal onClose={() => setShowSheetsModal(false)} />
      )}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </>
  );
};
