const fs = require('fs');
const html = fs.readFileSync('mhdevs.html', 'utf8');
const searchString = "let's talk";
const index = html.toLowerCase().indexOf(searchString);
if (index !== -1) {
  console.log(html.substring(index - 100, index + 100));
} else {
  console.log('Not found');
}
