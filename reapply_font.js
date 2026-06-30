const fs = require('fs');

// Fix chunk
let js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.js', 'utf8');
const targetStr = 'fontFamily:s="Compressa VF",fontUrl:n="/fonts/Compressa-VF.woff2"';
const replacementStr = 'fontFamily:s="Roboto Flex",fontUrl:n="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap"';
if (js.includes(targetStr)) {
  js = js.replace(targetStr, replacementStr);
  fs.writeFileSync('_next/static/chunks/0is~5-fx~ag7_.js', js, 'utf8');
  console.log('Fixed chunk!');
}

// Fix template
let html = fs.readFileSync('index.template.html', 'utf8');
const targetStr2 = '"fontFamily":"Compressa VF","fontUrl":"/fonts/Compressa-VF.woff2"';
const replacementStr2 = '"fontFamily":"Roboto Flex","fontUrl":"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap"';
const targetStr3 = '\\"fontFamily\\":\\"Compressa VF\\",\\"fontUrl\\":\\"/fonts/Compressa-VF.woff2\\"';
const replacementStr3 = '\\"fontFamily\\":\\"Roboto Flex\\",\\"fontUrl\\":\\"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap\\"';

if (html.includes(targetStr2)) html = html.replace(targetStr2, replacementStr2);
if (html.includes(targetStr3)) html = html.replace(targetStr3, replacementStr3);
fs.writeFileSync('index.template.html', html, 'utf8');
console.log('Fixed template!');
