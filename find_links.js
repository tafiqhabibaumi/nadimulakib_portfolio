const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '_next', 'static', 'chunks');
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.js')) {
    const js = fs.readFileSync(path.join(dir, file), 'utf8');
    const links = js.match(/https:\/\/[^"']+/g);
    if (links) {
      console.log('In ' + file + ':', new Set(links));
    }
  }
}
