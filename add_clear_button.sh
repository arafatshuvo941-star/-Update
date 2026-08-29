#!/bin/bash
sed -i '/{\/\* Backup Action \*\/}/i \
          {/* Clear Database Action */}\
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">\
            <button\
              type="button"\
              onClick={() => {\
                if (window.confirm("আপনি কি নিশ্চিত? এর মাধ্যমে অ্যাপের সমস্ত ডাটা (পণ্য, কাস্টমার, বিক্রি, খরচ) মুছে যাবে!")) {\
                  clearDatabase();\
                  onClose();\
                }\
              }}\
              className="w-full py-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"\
            >\
              <Trash2 className="w-3.5 h-3.5" />\
              <span>সমস্ত ডাটা মুছে ফেলুন (Factory Reset)</span>\
            </button>\
          </div>\
' src/components/SettingsModal.tsx
