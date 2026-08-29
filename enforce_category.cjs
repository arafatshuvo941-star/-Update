const fs = require('fs');

let content = fs.readFileSync('src/components/ProductsManager.tsx', 'utf-8');

// replace category with finalCategory
const handleSave = `
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category.trim() || 'Other';
    const parsedPurchase = Math.max(0, Number(purchasePrice) || 0);
    const parsedSale = Math.max(0, Number(salePrice) || 0);
    const parsedStock = Math.max(0, Number(currentStock) || 0);
    const parsedMinStock = Math.max(0, Number(minStock) || 5);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: name.trim(),
        category: finalCategory,
`;

content = content.replace(
  /const handleSaveProduct = \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*if \(\!name\.trim\(\)\) return;\s*const parsedPurchase = Math\.max\(0, Number\(purchasePrice\) \|\| 0\);\s*const parsedSale = Math\.max\(0, Number\(salePrice\) \|\| 0\);\s*const parsedStock = Math\.max\(0, Number\(currentStock\) \|\| 0\);\s*const parsedMinStock = Math\.max\(0, Number\(minStock\) \|\| 5\);\s*if \(editingProduct\) \{\s*updateProduct\(editingProduct\.id, \{\s*name: name\.trim\(\),\s*category,/m,
  handleSave
);

content = content.replace(
  /\} else \{\s*addProduct\(\{\s*name: name\.trim\(\),\s*category,/m,
  '} else {\n      addProduct({\n        name: name.trim(),\n        category: finalCategory,'
);

fs.writeFileSync('src/components/ProductsManager.tsx', content, 'utf-8');
console.log('Enforced finalCategory fallback');
