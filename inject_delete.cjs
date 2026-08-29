const fs = require('fs');
let content = fs.readFileSync('src/components/ReceiptModal.tsx', 'utf-8');

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

content = content.replace(
    '<button onClick={onClose}',
    newDeleteBtn + '\n          <button onClick={onClose}'
);

fs.writeFileSync('src/components/ReceiptModal.tsx', content, 'utf-8');
console.log('Injected delete btn');
