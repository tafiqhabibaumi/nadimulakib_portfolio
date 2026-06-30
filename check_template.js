const fs = require('fs');
const js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', 'utf8');
console.log('Contains original Mehedi Hasan:', js.includes('"Mehedi Hasan"'));
console.log('Contains Nadimul Haque Akib:', js.includes('"Nadimul Haque Akib"'));
