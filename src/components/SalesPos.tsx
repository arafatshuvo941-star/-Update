import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Customer, PaymentMethod } from '../types';
import { formatTaka, toIsoDateString, formatBdDate } from '../utils/formatters';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  User,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Tag,
  Check,
  X,
  Sparkles,
  Smartphone,
  Zap,
  PhoneCall,
  ReceiptText,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReceiptModal } from './ReceiptModal';

const OPERATORS = [
  { id: 'GP', name: 'গ্রামীণফোন (GP)', color: 'bg-sky-500 text-white', border: 'border-sky-500', prefix: '017 / 013', commissionRate: 0.028 },
  { id: 'Banglalink', name: 'বাংলালিংক (BL)', color: 'bg-amber-500 text-white', border: 'border-amber-500', prefix: '019 / 014', commissionRate: 0.028 },
  { id: 'Robi', name: 'রবি (Robi)', color: 'bg-rose-500 text-white', border: 'border-rose-500', prefix: '018', commissionRate: 0.028 },
  { id: 'Airtel', name: 'এয়ারটেল (Airtel)', color: 'bg-red-600 text-white', border: 'border-red-600', prefix: '016', commissionRate: 0.028 },
  { id: 'Teletalk', name: 'টেলিটক (Teletalk)', color: 'bg-emerald-600 text-white', border: 'border-emerald-600', prefix: '015', commissionRate: 0.030 },
  { id: 'bKash', name: 'বিকাশ ক্যাশ ইন (bKash)', color: 'bg-pink-600 text-white', border: 'border-pink-600', prefix: 'MFS Cash In', commissionRate: 0.004 },
  { id: 'Nagad', name: 'নগদ ক্যাশ ইন (Nagad)', color: 'bg-orange-600 text-white', border: 'border-orange-600', prefix: 'MFS Cash In', commissionRate: 0.004 },
];

const PRESET_AMOUNTS = [20, 30, 50, 89, 100, 120, 150, 199, 299, 499];

interface CartQuantityInputProps {
  itemId: string;
  quantity: number;
  maxStock: number;
  onUpdate: (id: string, qty: number) => void;
}

const CartQuantityInput: React.FC<CartQuantityInputProps> = ({ itemId, quantity, maxStock, onUpdate }) => {
  const [val, setVal] = useState<string>(String(quantity));

  useEffect(() => {
    setVal(String(quantity));
  }, [quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setVal(raw);
    if (raw.trim() === '') {
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      const clamped = Math.min(num, maxStock > 0 ? maxStock : 999999);
      onUpdate(itemId, clamped);
    }
  };

  const handleBlur = () => {
    if (val.trim() === '') {
      setVal('1');
      onUpdate(itemId, 1);
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      setVal('1');
      onUpdate(itemId, 1);
    } else {
      const clamped = Math.min(num, maxStock > 0 ? maxStock : 999999);
      setVal(String(clamped));
      onUpdate(itemId, clamped);
    }
  };

  return (
    <input
      type="number" step="any"
      min="0"
      max={maxStock > 0 ? maxStock : undefined}
      value={val}
      placeholder="১"
      onFocus={(e) => e.target.select()}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-14 h-7 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
    />
  );
};

export const SalesPos: React.FC = () => {
  const {
    products,
    customers,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    processSale,
    addCustomer,
    lastSale,
    setLastSale,
    t,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [walkInName, setWalkInName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => toIsoDateString(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Quick Mobile Load Modal State
  const [showQuickLoadModal, setShowQuickLoadModal] = useState(false);
  const [loadOperator, setLoadOperator] = useState('GP');
  const [loadPhone, setLoadPhone] = useState('');
  const [loadAmount, setLoadAmount] = useState('100');
  const [customCommissionRate, setCustomCommissionRate] = useState<string>('2.8'); // Percentage, e.g. 2.8% or 2.7%
  const [loadNote, setLoadNote] = useState('');

  // Mobile View Tab state ('products' or 'cart')
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');

  // Total quantity pieces in cart
  const cartTotalPieces = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products by search, category, and stock status
  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.currentStock <= 0).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.extraInfo && p.extraInfo.toLowerCase().includes(q));
      
      // If hideOutOfStock is active and user is not searching specifically, hide 0 stock products
      const matchesStock = hideOutOfStock ? p.currentStock > 0 : true;

      return matchesCategory && matchesSearch && matchesStock;
    });
  }, [products, selectedCategory, searchQuery, hideOutOfStock]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const discount = Math.max(0, Number(discountInput) || 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const parsedPaid = Number(paidAmountInput);
  const effectivePaid =
    paymentMethod === 'Due'
      ? 0
      : paidAmountInput !== '' && !isNaN(parsedPaid)
      ? Math.min(grandTotal, Math.max(0, parsedPaid))
      : grandTotal;
  const calculatedDue = Math.max(0, grandTotal - effectivePaid);

  // Handle Complete Sale
  const handleCheckout = async () => {
    setErrorMessage(null);
    if (cart.length === 0) {
      setErrorMessage('কার্ট খালি! পণ্য সিলেক্ট করুন।');
      return;
    }

    if (calculatedDue > 0 && !selectedCustomer) {
      setErrorMessage('বাকি বিক্রির জন্য কাস্টমার সিলেক্ট বা তৈরি করুন।');
      return;
    }

    setIsProcessing(true);
    try {
      let saleDateIso: string = new Date().toISOString();
      if (invoiceDate) {
        const now = new Date();
        const [y, m, d] = invoiceDate.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const targetDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
          saleDateIso = targetDate.toISOString();
        }
      }

      const res = await processSale({
        customer: selectedCustomer,
        walkInName: selectedCustomer ? undefined : walkInName || 'নগদ ক্রেতা',
        customerPhone: selectedCustomer ? selectedCustomer.phone : customerPhone,
        discount,
        paidAmount: effectivePaid,
        paymentMethod: paymentMethod === 'Due' ? 'Due' : calculatedDue > 0 ? 'Split' : paymentMethod,
        paymentDetails,
        saleDate: saleDateIso,
      });

      if (res.success && res.sale) {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (e) {}

        // Reset form inputs
        setDiscountInput('');
        setPaidAmountInput('');
        setPaymentDetails('');
        setWalkInName('');
        setCustomerPhone('');
        setSelectedCustomer(null);
        setInvoiceDate(toIsoDateString(new Date()));
        setMobileTab('products');
      } else {
        setErrorMessage(res.error || 'বিক্রি সেভ করতে সমস্যা হয়েছে।');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while saving sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;

    const created = addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      address: newCustomerAddress.trim() || undefined,
    });

    setSelectedCustomer(created);
    setShowNewCustomerModal(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
  };

  const handleAddQuickLoadToCart = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(loadAmount);
    if (isNaN(amount) || amount <= 0) return;

    const op = OPERATORS.find((o) => o.id === loadOperator) || OPERATORS[0];
    const parsedCustomRate = parseFloat(customCommissionRate);
    const commRate = !isNaN(parsedCustomRate) && parsedCustomRate >= 0 ? parsedCustomRate / 100 : op.commissionRate;
    const purchaseCost = Math.round(amount * (1 - commRate) * 100) / 100;

    const formattedRecipient = loadPhone.trim() ? loadPhone.trim() : 'কাউন্টার লোড';
    const loadProduct: Product = {
      id: `LOAD-${Date.now()}`,
      name: `${op.name} - ${formattedRecipient} (${formatTaka(amount)})`,
      category: 'Mobile Load',
      unit: 'tk',
      purchasePrice: purchaseCost,
      salePrice: amount,
      currentStock: 99999,
      minStock: 100,
      extraInfo: loadNote ? `${loadNote} | কমিশন: ${(commRate * 100).toFixed(2)}% | নম্বর: ${formattedRecipient}` : `কমিশন: ${(commRate * 100).toFixed(2)}% | নম্বর: ${formattedRecipient}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addToCart(loadProduct, 1);
    setShowQuickLoadModal(false);
    setLoadPhone('');
    setLoadNote('');
    setLoadAmount('100');
  };

  return (
    <div className="pb-32 md:pb-8 relative">
      {/* Mobile Segmented View Switcher (Only visible on small screens) */}
      <div className="lg:hidden flex items-center bg-slate-200/90 p-1 rounded-2xl mb-3 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === 'products'
              ? 'bg-white dark:bg-slate-800 text-emerald-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>পণ্য নির্বাচন</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            mobileTab === 'cart'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
          }`}
        >
          <ReceiptText className="w-4 h-4 text-emerald-400" />
          <span>বিক্রির রশিদ (Sell Sheet)</span>
          {cart.length > 0 && (
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Top Layout Grid: Left Product Selector, Right Floating Cart & Checkout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Product Catalog / Search (7 Cols on desktop, shown on mobile when mobileTab === 'products') */}
        <div className={`lg:col-span-7 space-y-3 ${mobileTab === 'products' ? 'block' : 'hidden lg:block'}`}>
          {/* Quick Action Bar for Mobile Load / Flexiload */}
          <div className="flex items-center gap-2">
            <button
              id="btn-quick-mobile-load"
              type="button"
              onClick={() => setShowQuickLoadModal(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-linear-to-r from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white rounded-xl shadow-xs transition-all active:scale-98 font-bold text-xs sm:text-sm group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span>⚡ দ্রুত মোবাইল লোড / রিচার্জ ও বিকাশ/নগদ</span>
                    <span className="bg-amber-400 text-slate-900 dark:text-slate-100 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Quick
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-100 font-normal">
                    জিপি, বাংলালিংক, রবি, এয়ারটেল, টেলিটক যেকোনো টাকার লোড
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-sky-200 group-hover:text-white">
                <span>লোড করুন</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="input-product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্যের নাম, ক্যাটাগরি বা বারকোড {t('search')}"
              className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills & Stock Toggle */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {cat === 'All' ? 'সকল পণ্য' : cat}
                </button>
              ))}
            </div>

            {outOfStockCount > 0 && (
              <button
                type="button"
                onClick={() => setHideOutOfStock(!hideOutOfStock)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  hideOutOfStock
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="স্টক শেষ পণ্য লুকানো/দেখানো"
              >
                <span>{hideOutOfStock ? `স্টক শেষ লুকানো (${outOfStockCount})` : `{t('allCategories')} দেখাচ্ছে (${outOfStockCount} টি শেষ)`}</span>
              </button>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">কোনো পণ্য পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400 mt-1">অন্য নামে সার্চ করুন অথবা নতুন পণ্য যোগ করুন</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const inCart = cart.find((it) => it.product.id === prod.id);
                const isOutOfStock = prod.currentStock <= 0;
                const isLowStock = prod.currentStock <= prod.minStock;

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        addToCart(prod, 1);
                      }
                    }}
                    className={`bg-white dark:bg-slate-800 rounded-xl p-3 border text-left flex flex-col justify-between transition-all cursor-pointer select-none relative group ${
                      inCart
                        ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:shadow-xs'
                    } ${isOutOfStock ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : 'active:scale-98'}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {prod.category}
                        </span>
                        {inCart && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            x{inCart.quantity}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mt-1 leading-snug line-clamp-2">
                        {prod.name}
                      </h4>

                      {prod.extraInfo && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {prod.extraInfo}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-800 font-mono block leading-none truncate">
                          {formatTaka(prod.salePrice)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold mt-0.5 inline-block truncate ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          {isOutOfStock ? 'স্টক নেই' : `মজুদ: ${prod.currentStock} ${prod.unit}`}
                        </span>
                      </div>

                      {/* Interactive + and - Stepper or Single + Button */}
                      {inCart ? (
                        <div
                          className="flex items-center bg-emerald-50 border border-emerald-300 rounded-lg p-0.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQuantity(prod.id, inCart.quantity - 1);
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="{t('qty')} কমান (-)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 sm:w-7 text-center font-bold text-xs text-emerald-900 font-mono select-none">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={inCart.quantity >= prod.currentStock && prod.currentStock > 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inCart.quantity < prod.currentStock || prod.currentStock <= 0) {
                                updateCartQuantity(prod.id, inCart.quantity + 1);
                              }
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="{t('qty')} বাড়ান (+)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) {
                              addToCart(prod, 1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 dark:text-slate-300 active:scale-95 transition-colors cursor-pointer shrink-0"
                          title="কার্টে যোগ করুন (+)"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Checkout Panel (5 Cols on desktop, shown on mobile when mobileTab === 'cart') */}
        <div className={`lg:col-span-5 space-y-3 ${mobileTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden sticky top-18">
            {/* Cart & Invoice Header */}
            <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm truncate">
                      বিক্রয় মেমো ({cart.length})
                    </h3>
                  </div>
                  {/* Invoice Date Selector in Header */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-300">
                    <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-slate-400">তারিখ:</span>
                    <input
                      id="input-invoice-date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-slate-700 hover:border-emerald-500 rounded px-1.5 py-0.2 text-[10px] sm:text-[11px] font-bold outline-none cursor-pointer"
                      title="ইনভয়েস তারিখ নির্বাচন করুন"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Back to Products Button on Mobile */}
                <button
                  type="button"
                  onClick={() => setMobileTab('products')}
                  className="lg:hidden text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer border border-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>পণ্য</span>
                </button>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-300 hover:text-white flex items-center gap-1 px-1.5 py-1 rounded hover:bg-rose-900/30 transition-colors cursor-pointer"
                    title="কার্ট খালি করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">মুছুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-3 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('emptyCart')}
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.product.name}
                      </h5>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatTaka(item.unitPrice)} x {item.quantity} = {formatTaka(item.total)}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <CartQuantityInput
                        itemId={item.product.id}
                        quantity={item.quantity}
                        maxStock={item.product.currentStock}
                        onUpdate={updateCartQuantity}
                      />
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Picker */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>কাস্টমার (বাকি/লেনদেন খাতা):</span>
                </label>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ নতুন কাস্টমার</span>
                </button>
              </div>

              <select
                id="select-customer"
                value={selectedCustomer ? selectedCustomer.id : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedCustomer(null);
                  } else {
                    const found = customers.find((c) => c.id === val);
                    setSelectedCustomer(found || null);
                  }
                }}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">নগদ ক্রেতা (নামহীন কাস্টমার)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.totalDue > 0 ? `- পূর্বের বাকি: ${formatTaka(c.totalDue)}` : ''}
                  </option>
                ))}
              </select>

              {/* If customer is selected and has due */}
              {selectedCustomer && selectedCustomer.totalDue > 0 && (
                <div className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex justify-between">
                  <span>পূর্বের বকেয়া বাকি:</span>
                  <span className="font-bold font-mono">{formatTaka(selectedCustomer.totalDue)}</span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                পরিশোধ মাধ্যম (Payment Method):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'bKash', 'Nagad', 'Due'] as PaymentMethod[]).map((method) => {
                  const isActive = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                        isActive
                          ? method === 'Cash'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : method === 'bKash'
                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                            : method === 'Nagad'
                            ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                            : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {method === 'Cash'
                        ? 'নগদ'
                        : method === 'bKash'
                        ? 'বিকাশ'
                        : method === 'Nagad'
                        ? 'নগদ'
                        : 'বাকি'}
                    </button>
                  );
                })}
              </div>

              {/* Extra input for bKash/Nagad Trx ID */}
              {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && (
                <input
                  type="text"
                  placeholder={`${paymentMethod} Trx ID / নম্বর (ঐচ্ছিক)`}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                />
              )}

              {/* If Due or Split payment */}
              {paymentMethod === 'Due' && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-bold text-center">
                  সম্পূর্ণ বিল ৳{grandTotal} কাস্টমারের বাকি খাতায় যুক্ত হবে
                </div>
              )}
            </div>

            {/* Bill Summary & Complete Sale Button */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>সাবটোটাল:</span>
                <span className="font-mono font-bold">{formatTaka(subtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {t('discount')}:
                </span>
                <input
                  id="input-sale-discount"
                  type="number" step="any"
                  placeholder="0"
                  value={discountInput}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-24 p-1.5 text-right bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-300 dark:border-slate-600">
                <span>সর্ব{t('total')} বিল:</span>
                <span className="font-mono text-base text-emerald-800">{formatTaka(grandTotal)}</span>
              </div>

              {/* Paid Amount Input & Due calculation for Partial / Split payment */}
              {paymentMethod !== 'Due' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">জমা দিয়েছেন (৳):</label>
                    <div className="flex items-center gap-1">
                      <input
                        id="input-paid-amount"
                        type="number" step="any"
                        min="0"
                        max={grandTotal}
                        placeholder={String(grandTotal)}
                        value={paidAmountInput}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setPaidAmountInput(e.target.value)}
                        className="w-24 p-1.5 text-right bg-white dark:bg-slate-800 border border-emerald-400 rounded-lg text-xs font-mono font-extrabold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center justify-end gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPaidAmountInput(String(grandTotal))}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-medium border border-emerald-200"
                    >
                      ফুল পরিশোধ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmountInput(String(Math.floor(grandTotal / 2)))}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-medium border border-slate-200 dark:border-slate-700"
                    >
                      অর্ধেক (৫০%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmountInput('0')}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-medium border border-rose-200"
                    >
                      বাকি (৳০)
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Breakdown if Partial Payment or Due */}
              {calculatedDue > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-amber-900">
                    <span>জমা (Paid):</span>
                    <span className="font-mono font-bold text-emerald-700">{formatTaka(effectivePaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-700 text-sm pt-0.5 border-t border-amber-200">
                    <span>বকেয়া বাকি (Due):</span>
                    <span className="font-mono font-extrabold">{formatTaka(calculatedDue)}</span>
                  </div>
                  {!selectedCustomer && (
                    <div className="pt-1 text-[11px] text-rose-800 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>উপরে কাস্টমারের নাম সিলেক্ট করুন (বাকি খাতায় যোগ হবে)</span>
                    </div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="p-2 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Complete Sale Action Button */}
              <button
                id="btn-complete-sale"
                disabled={isProcessing || cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                {isProcessing ? (
                  <span>{t('savingSale')}</span>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>বিক্রি নিশ্চিত করুন ({formatTaka(grandTotal)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Quick Cart Bar (Appears when items are in cart and viewing products) */}
      {cart.length > 0 && mobileTab === 'products' && (
        <div className="lg:hidden fixed bottom-18 left-0 right-0 px-3 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 pl-1.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                {cart.length}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-300 font-medium truncate">
                  {t('total')} {cartTotalPieces} টি পণ্য কার্টে
                </div>
                <div className="text-sm font-mono font-black text-emerald-400 leading-tight">
                  {formatTaka(grandTotal)}
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-mobile-open-cart"
              onClick={() => setMobileTab('cart')}
              className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <span>রশিদ ও বিক্রি</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Fast Add New Customer on the fly */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">নতুন কাস্টমার যোগ করুন</h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ করিম সাহেব"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">ঠিকানা / এলাকা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: উত্তর পাড়া"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  কাস্টমার সেভ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Mobile Load & MFS Cash In */}
      {showQuickLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">মোবাইল লোড / রিচার্জ / ক্যাশ ইন</h3>
                  <p className="text-[11px] text-slate-500">অপারেটর ও টাকার {t('qty')} লিখে কার্টে যোগ করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickLoadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuickLoadToCart} className="space-y-3.5">
              {/* Operator Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  সিম অপারেটর / সার্ভিস নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {OPERATORS.map((op) => {
                    const isSelected = loadOperator === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          setLoadOperator(op.id);
                          setCustomCommissionRate((op.commissionRate * 100).toFixed(1));
                        }}
                        className={`p-2 rounded-xl text-xs font-bold text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? `${op.border} ring-2 ring-sky-300 bg-sky-50/50 text-slate-900 dark:text-slate-100`
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900'
                        }`}
                      >
                        <span className="truncate">{op.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal mt-0.5">{op.prefix}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Phone Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মোবাইল নম্বর (Recipient Number):
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={loadPhone}
                    onChange={(e) => setLoadPhone(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:bg-slate-800"
                  />
                  <PhoneCall className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Amount Selection & Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">রিচার্জের {t('qty')} (টাকা):</label>
                  <span className="text-[11px] font-bold text-emerald-700">
                    লাভ/কমিশন: ৳
                    {(
                      ((parseFloat(loadAmount) || 0) * (parseFloat(customCommissionRate) || 0)) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
                <input
                  type="number" step="any"
                  required
                  min="10"
                  placeholder="যেমন: 100"
                  value={loadAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setLoadAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-mono font-extrabold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:bg-slate-800"
                />

                {/* Preset Amount Buttons */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLoadAmount(String(amt))}
                      className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                        loadAmount === String(amt)
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Commission Rate Setting */}
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-amber-900 block">
                      আপনার নিজস্ব কমিশন রেট (%)
                    </label>
                    <p className="text-[10px] text-amber-700">
                      যেমন: হাজারে ২৮ টাকা হলে ২.৮% বা হাজারে ২৭ টাকা হলে ২.৭%
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" step="any"
                      min="0"
                      max="100"
                      value={customCommissionRate}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCustomCommissionRate(e.target.value)}
                      className="w-16 p-1.5 text-center bg-white dark:bg-slate-800 border border-amber-300 rounded-lg text-xs font-mono font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-900">%</span>
                  </div>
                </div>
              </div>

              {/* Optional Package Note */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  নোট / প্যাকেজের নাম (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ১ জিবি ৭ দিন বা স্পেশাল অফার"
                  value={loadNote}
                  onChange={(e) => setLoadNote(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickLoadModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>কার্টে লোড যোগ করুন ({formatTaka(parseFloat(loadAmount) || 0)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Receipt Modal upon successful sale */}
      {lastSale && (
        <ReceiptModal sale={lastSale} onClose={() => setLastSale(null)} />
      )}
    </div>
  );
};
