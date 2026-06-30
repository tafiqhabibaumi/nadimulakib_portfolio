const fs = require('fs');
const html = fs.readFileSync('index.template.html', 'utf8');
const index = html.indexOf("LET'S TALK");
console.log(html.substring(index - 400, index + 200));
