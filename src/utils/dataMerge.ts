import { Product, Sale, Customer, Payment, Expense } from '../types';
import { isItemDeleted } from './tombstones';

/**
 * Smart Bi-directional Deduplicating Merge Utility
 * Guarantees NO duplicate entries, NO accidental data loss, AND strictly respects deletions.
 */

export function mergeProducts(local: Product[], incoming: Product[]): Product[] {
  const mergedMap = new Map<string, Product>();
  const nameCategoryKeyMap = new Map<string, string>(); // name_category -> id
  const barcodeKeyMap = new Map<string, string>(); // barcode -> id

  // 1. Load local products first (skipping any deleted ones)
  for (const prod of local) {
    if (!prod || !prod.name) continue;
    if (isItemDeleted(prod.id, prod.barcode)) continue;

    const cleanId = prod.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const normalizedProd: Product = {
      ...prod,
      id: cleanId,
      name: prod.name.trim(),
      category: prod.category || 'General Retail',
      unit: prod.unit || 'pcs',
      purchasePrice: Number(prod.purchasePrice) || 0,
      salePrice: Number(prod.salePrice) || 0,
      currentStock: Number(prod.currentStock) || 0,
      minStock: Number(prod.minStock) || 5,
      createdAt: prod.createdAt || new Date().toISOString(),
      updatedAt: prod.updatedAt || prod.createdAt || new Date().toISOString(),
    };

    mergedMap.set(cleanId, normalizedProd);
    const ncKey = `${normalizedProd.name.toLowerCase()}___${String(normalizedProd.category).toLowerCase()}`;
    nameCategoryKeyMap.set(ncKey, cleanId);

    if (normalizedProd.barcode) {
      barcodeKeyMap.set(normalizedProd.barcode.trim(), cleanId);
    }
  }

  // 2. Merge incoming products
  for (const inc of incoming) {
    if (!inc || !inc.name) continue;
    // If the product was deleted, NEVER resurrect it!
    if (isItemDeleted(inc.id, inc.barcode)) continue;

    const incName = inc.name.trim();
    const incCat = inc.category || 'General Retail';
    const ncKey = `${incName.toLowerCase()}___${String(incCat).toLowerCase()}`;
    const incBarcode = inc.barcode ? inc.barcode.trim() : undefined;

    // Check if matching by ID, Barcode, or Name+Category
    let matchedId = inc.id && mergedMap.has(inc.id) ? inc.id : undefined;
    if (!matchedId && incBarcode && barcodeKeyMap.has(incBarcode)) {
      matchedId = barcodeKeyMap.get(incBarcode);
    }
    if (!matchedId && nameCategoryKeyMap.has(ncKey)) {
      matchedId = nameCategoryKeyMap.get(ncKey);
    }

    if (matchedId) {
      const existing = mergedMap.get(matchedId)!;
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const incTime = new Date(inc.updatedAt || inc.createdAt || 0).getTime();

      // If incoming is strictly newer, update properties while retaining stable ID
      if (incTime > existingTime) {
        mergedMap.set(matchedId, {
          ...existing,
          ...inc,
          id: matchedId, // Maintain primary local ID
          name: incName,
          category: incCat,
          updatedAt: inc.updatedAt || new Date().toISOString(),
        });
      }
    } else {
      // Brand new incoming product
      const newId = inc.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newProd: Product = {
        ...inc,
        id: newId,
        name: incName,
        category: incCat,
        unit: inc.unit || 'pcs',
        purchasePrice: Number(inc.purchasePrice) || 0,
        salePrice: Number(inc.salePrice) || 0,
        currentStock: Number(inc.currentStock) || 0,
        minStock: Number(inc.minStock) || 5,
        createdAt: inc.createdAt || new Date().toISOString(),
        updatedAt: inc.updatedAt || inc.createdAt || new Date().toISOString(),
      };
      mergedMap.set(newId, newProd);
      nameCategoryKeyMap.set(ncKey, newId);
      if (newProd.barcode) {
        barcodeKeyMap.set(newProd.barcode.trim(), newId);
      }
    }
  }

  return Array.from(mergedMap.values());
}

export function mergeSales(local: Sale[], incoming: Sale[]): Sale[] {
  const invoiceMap = new Map<string, Sale>();

  // 1. Process local (skipping any deleted ones)
  for (const s of local) {
    if (!s) continue;
    const inv = s.invoiceNumber || s.id;
    if (!inv) continue;
    if (isItemDeleted(s.id, s.invoiceNumber)) continue;

    invoiceMap.set(inv, {
      ...s,
      id: s.id || inv,
      invoiceNumber: inv,
      items: s.items || [],
    });
  }

  // 2. Merge incoming
  for (const inc of incoming) {
    if (!inc) continue;
    const inv = inc.invoiceNumber || inc.id;
    if (!inv) continue;
    // Skip if sale was deleted
    if (isItemDeleted(inc.id, inc.invoiceNumber)) continue;

    if (invoiceMap.has(inv)) {
      const existing = invoiceMap.get(inv)!;
      if ((!existing.items || existing.items.length === 0) && inc.items && inc.items.length > 0) {
        invoiceMap.set(inv, {
          ...existing,
          ...inc,
          id: existing.id || inv,
          invoiceNumber: inv,
          items: inc.items,
        });
      }
    } else {
      invoiceMap.set(inv, {
        ...inc,
        id: inc.id || inv,
        invoiceNumber: inv,
        items: inc.items || [],
      });
    }
  }

  return Array.from(invoiceMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function mergeCustomers(local: Customer[], incoming: Customer[]): Customer[] {
  const customerMap = new Map<string, Customer>();
  const phoneMap = new Map<string, string>(); // phone -> id
  const nameMap = new Map<string, string>(); // name -> id

  for (const c of local) {
    if (!c || !c.name) continue;
    if (isItemDeleted(c.id, c.phone)) continue;

    const id = c.id || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    const cleanName = c.name.trim().toLowerCase();

    const normalized: Customer = {
      ...c,
      id,
      name: c.name.trim(),
      phone: c.phone || '',
      totalDue: Number(c.totalDue) || 0,
      totalPurchases: Number(c.totalPurchases) || 0,
      createdAt: c.createdAt || new Date().toISOString(),
    };

    customerMap.set(id, normalized);
    if (cleanPhone.length >= 7) phoneMap.set(cleanPhone, id);
    nameMap.set(cleanName, id);
  }

  for (const inc of incoming) {
    if (!inc || !inc.name) continue;
    if (isItemDeleted(inc.id, inc.phone)) continue;

    const incPhone = (inc.phone || '').replace(/\D/g, '');
    const incName = inc.name.trim().toLowerCase();

    let matchedId = inc.id && customerMap.has(inc.id) ? inc.id : undefined;
    if (!matchedId && incPhone.length >= 7 && phoneMap.has(incPhone)) {
      matchedId = phoneMap.get(incPhone);
    }
    if (!matchedId && nameMap.has(incName)) {
      matchedId = nameMap.get(incName);
    }

    if (matchedId) {
      const existing = customerMap.get(matchedId)!;
      customerMap.set(matchedId, {
        ...existing,
        ...inc,
        id: matchedId,
        name: inc.name.trim(),
        totalDue: Math.max(existing.totalDue || 0, Number(inc.totalDue) || 0),
        totalPurchases: Math.max(existing.totalPurchases || 0, Number(inc.totalPurchases) || 0),
        lastTransactionDate: inc.lastTransactionDate || existing.lastTransactionDate,
      });
    } else {
      const newId = inc.id || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newCust: Customer = {
        ...inc,
        id: newId,
        name: inc.name.trim(),
        phone: inc.phone || '',
        totalDue: Number(inc.totalDue) || 0,
        totalPurchases: Number(inc.totalPurchases) || 0,
        createdAt: inc.createdAt || new Date().toISOString(),
      };
      customerMap.set(newId, newCust);
      if (incPhone.length >= 7) phoneMap.set(incPhone, newId);
      nameMap.set(incName, newId);
    }
  }

  return Array.from(customerMap.values());
}

export function mergePayments(local: Payment[], incoming: Payment[]): Payment[] {
  const payMap = new Map<string, Payment>();
  const trxKeyMap = new Map<string, string>();

  for (const p of local) {
    if (!p) continue;
    if (isItemDeleted(p.id, p.trxId)) continue;

    const id = p.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    payMap.set(id, { ...p, id });
    if (p.trxId) {
      trxKeyMap.set(p.trxId.trim(), id);
    }
  }

  for (const inc of incoming) {
    if (!inc) continue;
    if (isItemDeleted(inc.id, inc.trxId)) continue;

    let matchedId = inc.id && payMap.has(inc.id) ? inc.id : undefined;
    if (!matchedId && inc.trxId && trxKeyMap.has(inc.trxId.trim())) {
      matchedId = trxKeyMap.get(inc.trxId.trim());
    }

    if (!matchedId) {
      for (const [existingId, ex] of payMap.entries()) {
        if (
          ex.customerId === inc.customerId &&
          ex.amount === inc.amount &&
          (ex.createdAt || '').slice(0, 16) === (inc.createdAt || '').slice(0, 16)
        ) {
          matchedId = existingId;
          break;
        }
      }
    }

    if (!matchedId) {
      const newId = inc.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      payMap.set(newId, { ...inc, id: newId });
      if (inc.trxId) {
        trxKeyMap.set(inc.trxId.trim(), newId);
      }
    }
  }

  return Array.from(payMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function mergeExpenses(local: Expense[], incoming: Expense[]): Expense[] {
  const expMap = new Map<string, Expense>();

  for (const e of local) {
    if (!e) continue;
    if (isItemDeleted(e.id)) continue;

    const id = e.id || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    expMap.set(id, { ...e, id });
  }

  for (const inc of incoming) {
    if (!inc) continue;
    if (isItemDeleted(inc.id)) continue;

    let matchedId = inc.id && expMap.has(inc.id) ? inc.id : undefined;

    if (!matchedId) {
      for (const [existingId, ex] of expMap.entries()) {
        if (
          ex.title.trim().toLowerCase() === inc.title.trim().toLowerCase() &&
          ex.amount === inc.amount &&
          (ex.createdAt || '').slice(0, 16) === (inc.createdAt || '').slice(0, 16)
        ) {
          matchedId = existingId;
          break;
        }
      }
    }

    if (!matchedId) {
      const newId = inc.id || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      expMap.set(newId, { ...inc, id: newId });
    }
  }

  return Array.from(expMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
