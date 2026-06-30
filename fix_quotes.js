const fs = require('fs');
let html = fs.readFileSync('index.template.html', 'utf8');

html = html.replace(/""<!-- ABOUT_RSC_P1 -->""/g, '"<!-- ABOUT_RSC_P1 -->"');
html = html.replace(/\\""<!-- ABOUT_RSC_P1 -->\\"\\"/g, '\\"<!-- ABOUT_RSC_P1 -->\\"');
html = html.replace(/\\"\\"<!-- ABOUT_RSC_P1 -->\\"\\"/g, '\\"<!-- ABOUT_RSC_P1 -->\\"');

html = html.replace(/""<!-- ABOUT_RSC_SUBTITLE -->""/g, '"<!-- ABOUT_RSC_SUBTITLE -->"');
html = html.replace(/\\""<!-- ABOUT_RSC_SUBTITLE -->\\"\\"/g, '\\"<!-- ABOUT_RSC_SUBTITLE -->\\"');
html = html.replace(/\\"\\"<!-- ABOUT_RSC_SUBTITLE -->\\"\\"/g, '\\"<!-- ABOUT_RSC_SUBTITLE -->\\"');

html = html.replace(/""<!-- ABOUT_RSC_P2 -->""/g, '"<!-- ABOUT_RSC_P2 -->"');
html = html.replace(/\\""<!-- ABOUT_RSC_P2 -->\\"\\"/g, '\\"<!-- ABOUT_RSC_P2 -->\\"');
html = html.replace(/\\"\\"<!-- ABOUT_RSC_P2 -->\\"\\"/g, '\\"<!-- ABOUT_RSC_P2 -->\\"');

fs.writeFileSync('index.template.html', html, 'utf8');
console.log('Fixed extra quotes in template!');
