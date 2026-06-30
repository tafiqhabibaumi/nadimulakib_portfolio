const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const titleMatch = html.match(/<title>.*?<\/title>/);
console.log('Title in html:', titleMatch ? titleMatch[0] : 'Not found');
const authorMatch = html.match(/<meta name="author" content=".*?"\/>/);
console.log('Author in html:', authorMatch ? authorMatch[0] : 'Not found');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  if (match[1].includes('self.__next_f.push') && match[1].includes('title\",\"0\",{\"children\"')) {
    const pushMatch = match[1].match(/self\.__next_f\.push\(([\s\S]*)\)/);
    const arr = new Function(`return ${pushMatch[1]}`)();
    console.log('RSC Title Block:', arr[1].substring(0, 150));
  }
}
