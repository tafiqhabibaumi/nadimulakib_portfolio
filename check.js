const fs = require('fs');
const js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', 'utf8');
console.log('Mehedi Hasan:', js.indexOf('"Mehedi Hasan"'));
console.log('Nadimul Haque Akib:', js.indexOf('"Nadimul Haque Akib"'));
