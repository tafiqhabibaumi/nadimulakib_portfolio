const fs = require('fs');
const html = fs.readFileSync('index.template.html', 'utf8');
const searchString = "TALK";
const index = html.indexOf(searchString);
if (index !== -1) {
  console.log(html.substring(index - 100, index + 100));
} else {
  console.log('Not found');
}
