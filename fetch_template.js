const https = require('https');
const fs = require('fs');

https.get('https://mhdevs.vercel.app/_next/static/chunks/0is~5-fx~ag7_.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes('"Mehedi Hasan"')) {
      fs.writeFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', data, 'utf8');
      console.log('Restored template from vercel!');
    } else {
      console.log('Vercel file does not contain Mehedi Hasan. Length:', data.length);
    }
  });
});
