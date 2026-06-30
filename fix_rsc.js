const fs = require('fs');
let html = fs.readFileSync('index.template.html', 'utf8');

const targetSub = '\\"Here is what I bring to the table\\"';
const replaceSub = '\\"<!-- ABOUT_RSC_SUBTITLE -->\\"';

console.log('Includes Subtitle?', html.includes(targetSub));
html = html.replace(targetSub, replaceSub);

fs.writeFileSync('index.template.html', html, 'utf8');
console.log('Replaced Subtitle in template!');
