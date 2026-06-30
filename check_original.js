const https = require('https');
https.get('https://mhdevs.vercel.app/_next/static/chunks/0is~5-fx~ag7_.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Contains original Mehedi Hasan:', data.includes('"Mehedi Hasan"'));
    console.log('Contains original MERN:', data.includes('"A MERN-Stack Web Developer"'));
    console.log('Length:', data.length);
  });
});
