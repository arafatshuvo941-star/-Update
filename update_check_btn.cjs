const fs = require('fs');

let content = fs.readFileSync('src/components/ProductsManager.tsx', 'utf-8');

const oldCode = `                      <input
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
                    </div>`;

const newCode = `                      <input
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
                          const finalCat = category.trim();
                          if (finalCat && !CATEGORIES.includes(finalCat as any) && !(settings?.customCategories || []).includes(finalCat)) {
                            updateSettings({ customCategories: [...(settings?.customCategories || []), finalCat] });
                          }
                          setIsCustomCategory(false);
                        }}
                        className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl transition-colors"
                        title="Save Category"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCategory(dynamicCategories[0] || 'General Retail');
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/ProductsManager.tsx', content, 'utf-8');
console.log('updated');
