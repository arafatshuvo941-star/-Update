#!/bin/bash
cat << 'INNER_EOF' > temp_delete_sale.js
  const deleteSale = useCallback((saleId: string) => {
    setSales((prev) => {
      const saleToDelete = prev.find((s) => s.id === saleId);
      if (!saleToDelete) return prev;

      // 1. Restore product stock
      setProducts((currentProducts) => {
        const updatedProducts = [...currentProducts];
        saleToDelete.items.forEach((item) => {
          const productIndex = updatedProducts.findIndex((p) => p.id === item.productId);
          if (productIndex !== -1) {
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              stock: updatedProducts[productIndex].stock + item.quantity,
              updatedAt: new Date().toISOString(),
            };
          }
        });
        return updatedProducts;
      });

      // 2. Reduce customer due if there was any due in this sale
      if (saleToDelete.customerId && saleToDelete.dueAmount > 0) {
        setCustomers((currentCustomers) => {
          const updatedCustomers = [...currentCustomers];
          const cIndex = updatedCustomers.findIndex((c) => c.id === saleToDelete.customerId);
          if (cIndex !== -1) {
            updatedCustomers[cIndex] = {
              ...updatedCustomers[cIndex],
              totalDue: Math.max(0, updatedCustomers[cIndex].totalDue - saleToDelete.dueAmount),
              updatedAt: new Date().toISOString(),
            };
          }
          return updatedCustomers;
        });
      }

      return prev.filter((s) => s.id !== saleId);
    });
    setLastSale((prev) => (prev && prev.id === saleId ? null : prev));
  }, []);
INNER_EOF

sed -i -e '/const deleteSale = useCallback((saleId: string) => {/,/}, \[\]);/c\' -e "$(cat temp_delete_sale.js)" src/context/StoreContext.tsx
