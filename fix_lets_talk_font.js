const fs = require('fs');

// 1. Revert font in JS chunk to Compressa VF
let js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.js', 'utf8');
const targetStr = 'fontFamily:s="Roboto Flex",fontUrl:n="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap"';
const newCompressaURL = '/_next/static/media/caa3a2e1cccd8315-s.p.16t1db8_9y2o~.woff2';
const replacementStr = 'fontFamily:s="Compressa VF",fontUrl:n="' + newCompressaURL + '"';

if (js.includes(targetStr)) {
  js = js.replace(targetStr, replacementStr);
  fs.writeFileSync('_next/static/chunks/0is~5-fx~ag7_.js', js, 'utf8');
  console.log('Fixed chunk!');
} else {
  console.log('Chunk did not contain the target string. Maybe it is already Compressa VF?');
}

// 2. Revert font in index.template.html RSC payload
let html = fs.readFileSync('index.template.html', 'utf8');
const t1 = '"fontFamily":"Roboto Flex","fontUrl":"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap"';
const r1 = '"fontFamily":"Compressa VF","fontUrl":"' + newCompressaURL + '"';
const t2 = '\\"fontFamily\\":\\"Roboto Flex\\",\\"fontUrl\\":\\"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap\\"';
const r2 = '\\"fontFamily\\":\\"Compressa VF\\",\\"fontUrl\\":\\"' + newCompressaURL + '\\"';

let replaced = false;
if (html.includes(t1)) { html = html.replace(t1, r1); replaced = true; }
if (html.includes(t2)) { html = html.replace(t2, r2); replaced = true; }

// 3. Inject @font-face for Compressa VF in the <head>
const fontFace = `
  @font-face {
    font-family: 'Compressa VF';
    src: url('${newCompressaURL}') format('woff2');
    font-weight: 100 900;
    font-style: normal;
  }
`;
if (!html.includes("font-family: 'Compressa VF'")) {
  html = html.replace('<style>', '<style>' + fontFace);
  replaced = true;
}

if (replaced) {
  fs.writeFileSync('index.template.html', html, 'utf8');
  console.log('Fixed template!');
} else {
  console.log('Template did not contain the target string or already has the font-face.');
}
