const fs = require('fs');

let content = fs.readFileSync('src/components/ProductsManager.tsx', 'utf-8');

const oldCode = `  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category.trim() || 'Other';`;

const newCode = `  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category.trim() || 'Other';
    if (!CATEGORIES.includes(finalCategory as any) && !(settings?.customCategories || []).includes(finalCategory)) {
      updateSettings({ customCategories: [...(settings?.customCategories || []), finalCategory] });
    }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/ProductsManager.tsx', content, 'utf-8');
console.log('updated');
