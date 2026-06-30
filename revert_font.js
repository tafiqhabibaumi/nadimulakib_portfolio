const fs = require('fs');
let js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.js', 'utf8');

const targetStr = 'fontFamily:s="Roboto Flex",fontUrl:n="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap"';
const replacementStr = 'fontFamily:s="Compressa VF",fontUrl:n="/fonts/Compressa-VF.woff2"';

if (js.includes(targetStr)) {
  js = js.replace(targetStr, replacementStr);
  fs.writeFileSync('_next/static/chunks/0is~5-fx~ag7_.js', js, 'utf8');
  console.log('Reverted font in chunk successfully!');
} else {
  console.log('Target string not found in chunk!');
}
