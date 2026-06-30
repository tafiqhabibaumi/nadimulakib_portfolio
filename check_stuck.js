const fs = require('fs');
let js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', 'utf8');

const regexAvatar = /\"(\/api\/image\?key=[^\"]+)\"/g;
let match;
while ((match = regexAvatar.exec(js)) !== null) {
  console.log('Found dynamic image URL:', match[1]);
}
const regexDesc = /\"I specialize in developing modern full-stack applications[^\"]*\"/g;
const matchDesc = js.match(regexDesc);
if (matchDesc) console.log('Found desc length:', matchDesc[0].length);
else console.log('Did not find original description prefix.');

console.log('Has original role:', js.includes('"A MERN-Stack Web Developer"'));
console.log('Has original name Mehedi Hasan:', js.includes('"Mehedi Hasan"'));
console.log('Has original avatar:', js.includes('"/images/mehedi.png"'));
console.log('Has Nadimul Haque Akib:', js.includes('"Nadimul Haque Akib"'));

