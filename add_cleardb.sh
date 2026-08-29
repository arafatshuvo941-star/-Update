#!/bin/bash
sed -i '/const signOut = () => {/i \
  const clearDatabase = useCallback(() => {\
    setProducts([]);\
    setSales([]);\
    setCustomers([]);\
    setPayments([]);\
    setExpenses([]);\
    setCart([]);\
    setLastSale(null);\
    // Optional: could reset settings, but usually users want to keep their shop name/settings.\
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);\
    localStorage.removeItem(STORAGE_KEYS.SALES);\
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);\
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);\
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);\
  }, []);\
' src/context/StoreContext.tsx
