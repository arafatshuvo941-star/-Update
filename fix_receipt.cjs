const fs = require('fs');

let content = fs.readFileSync('src/components/ReceiptModal.tsx', 'utf-8');

// 1. Add deleteSale to useStore
content = content.replace(
  "const { settings, updateSaleDate, t } = useStore();",
  "const { settings, updateSaleDate, deleteSale, t } = useStore();"
);

// 2. Add Trash2 to imports if not there
if(!content.includes("Trash2")) {
    content = content.replace(
        "Check,",
        "Check,\n  Trash2,"
    );
}

// 3. Add delete button
const deleteBtn = `
          <button
            onClick={() => {
              if(window.confirm('আপনি কি নিশ্চিত? এই বিক্রির হিসেবটি ডিলিট করলে স্টকে প্রোডাক্টগুলো আবার ফেরত যাবে।')) {
                deleteSale(sale.id);
                onClose();
              }
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
`;
content = content.replace(
  /(\s*<button\s*onClick=\{onClose\}\s*className="py-2 px-3 bg-white)/,
  deleteBtn + "$1"
);

fs.writeFileSync('src/components/ReceiptModal.tsx', content, 'utf-8');
console.log('Replaced ReceiptModal');
