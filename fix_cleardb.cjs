const fs = require('fs');

let content = fs.readFileSync('src/context/StoreContext.tsx', 'utf-8');

const regex = /localStorage.removeItem\(STORAGE_KEYS.EXPENSES\);/;

const replacement = `localStorage.removeItem(STORAGE_KEYS.EXPENSES);\n    window.location.reload();`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/context/StoreContext.tsx', content, 'utf-8');
console.log('Replaced clearDatabase');
