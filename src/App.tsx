/**
 * Universal Small Business Store App for Bangladesh
 * Powered by React, Tailwind CSS & Google Sheets Database
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { SalesPos } from './components/SalesPos';
import { ProductsManager } from './components/ProductsManager';
import { CustomersManager } from './components/CustomersManager';
import { ExpensesManager } from './components/ExpensesManager';
import { ReportsView } from './components/ReportsView';
import { AuthPage } from './components/AuthPage';

const StoreApp: React.FC = () => {
  const { activeTab, currentUser } = useStore();

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-600 selection:text-white">
      <Navbar />
      <BottomNav />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 min-h-[calc(100vh-120px)] w-full">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'sales' && <SalesPos />}
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'customers' && <CustomersManager />}
        {activeTab === 'expenses' && <ExpensesManager />}
        {activeTab === 'reports' && <ReportsView />}
      </main>
    </div>
  );
};

export default function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <StoreProvider>
      <StoreApp />
    </StoreProvider>
  );
}
