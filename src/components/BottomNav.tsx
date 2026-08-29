import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  ReceiptText,
  BarChart3,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t, metrics, cart } = useStore();

  const navItems = [
    {
      id: 'dashboard' as const,
      label: t('dashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'sales' as const,
      label: t('sales'),
      icon: ShoppingBag,
      highlight: true,
      badge: cart.length > 0 ? cart.length : null,
    },
    {
      id: 'products' as const,
      label: t('products'),
      icon: Package,
      badge: metrics.lowStockCount > 0 ? metrics.lowStockCount : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'customers' as const,
      label: t('customers'),
      icon: Users,
    },
    {
      id: 'expenses' as const,
      label: t('expenses'),
      icon: ReceiptText,
    },
    {
      id: 'reports' as const,
      label: t('reports'),
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation bar */}
      <nav id="desktop-nav" className="hidden md:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1 py-1.5 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`ml-1 text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold ${
                        item.badgeColor || 'bg-emerald-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg px-2 py-1.5"
      >
        <div className="grid grid-cols-6 items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  id={`nav-mobile-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center relative py-1 focus:outline-none"
                >
                  <div
                    className={`w-11 h-11 -mt-5 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                      isActive ? 'bg-emerald-700 text-white ring-2 ring-emerald-300' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="absolute -top-1 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 mt-0.5 truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`absolute -top-1 -right-2 text-[9px] text-white px-1 py-0.2 rounded-full font-bold leading-none ${
                        item.badgeColor || 'bg-emerald-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 truncate max-w-full leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
