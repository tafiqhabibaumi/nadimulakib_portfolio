const fs = require('fs');
const js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', 'utf8');
console.log('Includes title:', js.includes('MH.dev | Mehedi Hasan'));
console.log('Includes author:', js.includes('"author"'));
