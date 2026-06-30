const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');
console.log('Has metadata fields:', content.includes('id="meta_title"'));
console.log('Has author field:', content.includes('id="meta_author"'));
console.log('Metadata inputs in HTML:', content.match(/<input[^>]+id="meta_[^>]+>/g));
