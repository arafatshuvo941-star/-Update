const fs = require('fs');

let content = fs.readFileSync('src/components/ProductsManager.tsx', 'utf-8');

const oldDynCats = `  const dynamicCategories = useMemo(() => {
    const customCats = products.map((p) => p.category);
    return Array.from(new Set([...CATEGORIES, ...customCats].filter(Boolean))).sort();
  }, [products]);`;

const newDynCats = `  const dynamicCategories = useMemo(() => {
    const customCats = products.map((p) => p.category);
    const savedCustomCats = settings?.customCategories || [];
    return Array.from(new Set([...CATEGORIES, ...savedCustomCats, ...customCats].filter(Boolean))).sort();
  }, [products, settings?.customCategories]);`;

content = content.replace(oldDynCats, newDynCats);
fs.writeFileSync('src/components/ProductsManager.tsx', content, 'utf-8');
console.log('updated');
