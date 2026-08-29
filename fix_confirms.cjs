const fs = require('fs');

let settingsContent = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');
if (!settingsContent.includes('isConfirmingClear')) {
    settingsContent = settingsContent.replace(
        'const [savedSuccess, setSavedSuccess] = useState(false);',
        'const [savedSuccess, setSavedSuccess] = useState(false);\n  const [isConfirmingClear, setIsConfirmingClear] = useState(false);'
    );
    
    const oldClearBtnRegex = /<button\s+type="button"\s+onClick=\{\(\) => \{\s+if \(window\.confirm\("আপনি কি নিশ্চিত\? এর মাধ্যমে অ্যাপের সমস্ত ডাটা \(পণ্য, কাস্টমার, বিক্রি, খরচ\) মুছে যাবে!"\)\) \{\s+clearDatabase\(\);\s+onClose\(\);\s+\}\s+\}\}\s+className="w-full py-2 bg-rose-50 dark:bg-rose-900\/20 hover:bg-rose-100 dark:hover:bg-rose-900\/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800\/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"\s+>\s+<Trash2 className="w-3.5 h-3.5" \/>\s+<span>সমস্ত ডাটা মুছে ফেলুন \(Factory Reset\)<\/span>\s+<\/button>/;

    const newClearBtn = `{isConfirmingClear ? (
              <div className="flex flex-col gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-xl">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 text-center">আপনি কি নিশ্চিত? সমস্ত ডাটা মুছে যাবে!</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsConfirmingClear(false)} className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-bold transition-colors">না, বাতিল করুন</button>
                  <button type="button" onClick={() => { clearDatabase(); onClose(); }} className="flex-1 py-1.5 bg-rose-600 text-white rounded text-xs font-bold transition-colors">হ্যাঁ, নিশ্চিত</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="w-full py-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সমস্ত ডাটা মুছে ফেলুন (Factory Reset)</span>
              </button>
            )}`;

    settingsContent = settingsContent.replace(oldClearBtnRegex, newClearBtn);
    fs.writeFileSync('src/components/SettingsModal.tsx', settingsContent, 'utf-8');
    console.log('Fixed SettingsModal');
}

let receiptContent = fs.readFileSync('src/components/ReceiptModal.tsx', 'utf-8');
if (!receiptContent.includes('isConfirmingDelete')) {
    receiptContent = receiptContent.replace(
        'const [isEditingDate, setIsEditingDate] = useState(false);',
        'const [isEditingDate, setIsEditingDate] = useState(false);\n  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);'
    );

    const oldDeleteBtnRegex = /<button\s+onClick=\{\(\) => \{\s+if\(window\.confirm\('আপনি কি নিশ্চিত\? এই বিক্রির হিসেবটি ডিলিট করলে স্টকে প্রোডাক্টগুলো আবার ফেরত যাবে\.'\)\) \{\s+deleteSale\(sale\.id\);\s+onClose\(\);\s+\}\s+\}\}\s+className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 dark:bg-rose-900\/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold shadow-xs transition-colors"\s+>\s+<Trash2 className="w-4 h-4" \/>\s+<\/button>/;

    const newDeleteBtn = `{isConfirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-rose-600 font-bold">নিশ্চিত?</span>
              <button onClick={() => setIsConfirmingDelete(false)} className="py-1 px-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[10px] font-bold">না</button>
              <button onClick={() => { deleteSale(sale.id); onClose(); }} className="py-1 px-2 bg-rose-600 text-white rounded text-[10px] font-bold">হ্যাঁ</button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}`;

    receiptContent = receiptContent.replace(oldDeleteBtnRegex, newDeleteBtn);
    fs.writeFileSync('src/components/ReceiptModal.tsx', receiptContent, 'utf-8');
    console.log('Fixed ReceiptModal');
}
