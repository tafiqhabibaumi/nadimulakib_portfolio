const fs = require('fs');
const html = fs.readFileSync('index.template.html', 'utf8');
console.log('Connect:', html.includes('Connect'));
console.log('touch:', html.includes('touch'));
console.log('Contact:', html.includes('Contact'));
console.log('LET\\'S:', html.includes("LET'S"));
console.log('LET S:', html.includes("LET S"));
