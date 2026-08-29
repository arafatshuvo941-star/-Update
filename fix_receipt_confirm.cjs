const fs = require('fs');

let content = fs.readFileSync('src/components/ReceiptModal.tsx', 'utf-8');

const regex = /<button\s*onClick=\{\(\) => \{\s*if\(window\.confirm\('আপনি কি নিশ্চিত\? এই বিক্রির হিসেবটি ডিলিট করলে স্টকে প্রোডাক্টগুলো আবার ফেরত যাবে\.'\)\) \{\s*deleteSale\(sale\.id\);\s*onClose\(\);\s*\}\s*\}\}\s*className="flex items-center justify-center gap-1\.5 py-2 px-3 bg-rose-50 dark:bg-rose-900\/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold shadow-xs transition-colors"\s*>\s*<Trash2 className="w-4 h-4" \/>\s*<\/button>/;

content = content.replace(regex, '');

fs.writeFileSync('src/components/ReceiptModal.tsx', content, 'utf-8');
console.log('Removed duplicate window.confirm in ReceiptModal');
