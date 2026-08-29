const fs = require('fs');

let content = fs.readFileSync('src/components/ProductsManager.tsx', 'utf-8');

// 1. Add isCustomCategory state
content = content.replace(
  'const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);',
  'const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);\n  const [isCustomCategory, setIsCustomCategory] = useState(false);'
);

// 2. Add dynamicCategories useMemo
const dynamicCategoriesMemo = `
  const dynamicCategories = useMemo(() => {
    const customCats = products.map((p) => p.category);
    return Array.from(new Set([...CATEGORIES, ...customCats].filter(Boolean))).sort();
  }, [products]);
`;
content = content.replace(
  'const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);\n  const [isCustomCategory, setIsCustomCategory] = useState(false);',
  'const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);\n  const [isCustomCategory, setIsCustomCategory] = useState(false);\n' + dynamicCategoriesMemo
);

// 3. Replace filter categories loop
content = content.replace(
  /\{CATEGORIES\.map\(\(cat\) => \(\s*<option key=\{cat\} value=\{cat\}>\s*\{cat\} \(\{products\.filter\(\(p\) => p\.category === cat\)\.length\}\)\s*<\/option>\s*\)\)\}/g,
  `{dynamicCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({products.filter((p) => p.category === cat).length})
              </option>
            ))}`
);

// 4. Replace form category selection
const categoryInputStr = `
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('category')} *</label>
                  {isCustomCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="নতুন ক্যাটাগরি লিখুন"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCategory(dynamicCategories[0] || 'General Retail');
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsCustomCategory(true);
                          setCategory('');
                        } else {
                          handleCategoryChange(e.target.value as ProductCategory);
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {dynamicCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="ADD_NEW" className="font-bold text-emerald-600">+ নতুন ক্যাটাগরি তৈরি করুন</option>
                    </select>
                  )}
                </div>
`;

content = content.replace(
  /<div>\s*<label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">\{t\('category'\)\} \*<\/label>\s*<select\s*value=\{category\}\s*onChange=\{\(e\) => handleCategoryChange\(e\.target\.value as ProductCategory\)\}\s*className="w-full p-2\.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"\s*>\s*\{CATEGORIES\.map\(\(cat\) => \(\s*<option key=\{cat\} value=\{cat\}>\s*\{cat\}\s*<\/option>\s*\)\)\}\s*<\/select>\s*<\/div>/,
  categoryInputStr
);

fs.writeFileSync('src/components/ProductsManager.tsx', content, 'utf-8');
console.log('Categories made dynamic!');
