#!/bin/bash
for file in src/components/*.tsx src/App.tsx; do
  sed -i 's/bg-white/bg-white dark:bg-slate-800/g' "$file"
  sed -i 's/bg-slate-50/bg-slate-50 dark:bg-slate-900/g' "$file"
  sed -i 's/bg-slate-100/bg-slate-100 dark:bg-slate-800/g' "$file"
  sed -i 's/text-slate-900/text-slate-900 dark:text-slate-100/g' "$file"
  sed -i 's/text-slate-800/text-slate-800 dark:text-slate-200/g' "$file"
  sed -i 's/text-slate-700/text-slate-700 dark:text-slate-300/g' "$file"
  sed -i 's/text-slate-600/text-slate-600 dark:text-slate-400/g' "$file"
  sed -i 's/border-slate-200/border-slate-200 dark:border-slate-700/g' "$file"
  sed -i 's/border-slate-100/border-slate-100 dark:border-slate-800/g' "$file"
  sed -i 's/border-slate-300/border-slate-300 dark:border-slate-600/g' "$file"
  sed -i 's/divide-slate-100/divide-slate-100 dark:divide-slate-800/g' "$file"
  sed -i 's/divide-slate-200/divide-slate-200 dark:divide-slate-700/g' "$file"
done
