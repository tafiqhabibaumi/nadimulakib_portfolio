const fs = require('fs');

let js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', 'utf8');

// The exact strings we found that are stuck in the file:
js = js.split('"Nadimul Haque Akib"').join('"Mehedi Hasan"');
js = js.split('"Nadimul"').join('"Mehedi"');
js = js.split('"/images/mehedi.png"').join('"/images/mehedi.png"'); // Actually this might be different. Let's see what avatar is in the file.
js = js.split('"/resume.pdf"').join('"/resume.pdf"');
js = js.split('"MehediHasan.pdf"').join('"MehediHasan.pdf"');
js = js.split('"https://www.facebook.com/mehedi.hasan.376594"').join('"https://www.facebook.com/mehedi.hasan.376594"');
js = js.split('"Software Engineer"').join('"A MERN-Stack Web Developer"');
js = js.split('"/logo/logo.png"').join('"/logo/logo.png"');

fs.writeFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', js, 'utf8');
console.log('Fixed stuck strings in template.');
