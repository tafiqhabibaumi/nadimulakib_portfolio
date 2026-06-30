const fs = require('fs');
let js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', 'utf8');

js = js.split('"Nadimul Haque Akib"').join('"Mehedi Hasan"');
js = js.split('"Nadimul"').join('"Mehedi"');

const data = JSON.parse(fs.readFileSync('portfolio_data.json', 'utf8'));
if (data.hero.role) {
  js = js.split(JSON.stringify(data.hero.role)).join('"A MERN-Stack Web Developer"');
}

fs.writeFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', js, 'utf8');
console.log('Fixed stuck strings in template.');
