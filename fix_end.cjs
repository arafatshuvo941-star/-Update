const fs = require('fs');

let content = fs.readFileSync('src/components/ReceiptModal.tsx', 'utf-8');

const regex = /<button\s*<button\s*onClick=\{onClose\}/g;
content = content.replace(regex, '<button onClick={onClose}');

fs.writeFileSync('src/components/ReceiptModal.tsx', content, 'utf-8');
console.log('Fixed button syntax');
