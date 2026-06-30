const https = require('https');
https.get('https://mhdevs.vercel.app/', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const scripts = data.match(/src="([^"]+0is~5-fx~ag7_[^"]+)"/g);
    console.log('Scripts:', scripts);
    if (!scripts) {
        // Find Let's Talk
        const idx = data.indexOf("Let's Talk");
        if (idx !== -1) {
            console.log("Let's Talk context:", data.substring(Math.max(0, idx - 100), idx + 100));
        }
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
