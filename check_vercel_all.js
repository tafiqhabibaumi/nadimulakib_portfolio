const https = require('https');
https.get('https://mhdevs.vercel.app/', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const scripts = data.match(/src="([^"]+\.js)"/g);
    scripts.forEach(s => {
      const url = 'https://mhdevs.vercel.app' + s.replace('src="', '').replace('"', '');
      https.get(url, (res2) => {
        let js = '';
        res2.on('data', c => js += c);
        res2.on('end', () => {
          const fontIndex = js.indexOf('fontFamily:');
          if (fontIndex !== -1 && js.includes('Compressa')) {
            console.log('Found on Vercel JS:', js.substring(Math.max(0, fontIndex - 50), fontIndex + 200));
          }
        });
      });
    });
  });
});
