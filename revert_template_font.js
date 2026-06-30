const fs = require('fs');
let html = fs.readFileSync('index.template.html', 'utf8');

const targetStr = '"fontFamily":"Roboto Flex","fontUrl":"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap"';
const replacementStr = '"fontFamily":"Compressa VF","fontUrl":"/fonts/Compressa-VF.woff2"';

const targetStr2 = '\\"fontFamily\\":\\"Roboto Flex\\",\\"fontUrl\\":\\"https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap\\"';
const replacementStr2 = '\\"fontFamily\\":\\"Compressa VF\\",\\"fontUrl\\":\\"/fonts/Compressa-VF.woff2\\"';

let replaced = false;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, replacementStr);
  replaced = true;
}
if (html.includes(targetStr2)) {
  html = html.replace(targetStr2, replacementStr2);
  replaced = true;
}

if (replaced) {
  fs.writeFileSync('index.template.html', html, 'utf8');
  console.log('Reverted font in template successfully!');
} else {
  console.log('Target string not found in template!');
}
