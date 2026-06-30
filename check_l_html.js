const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://mhdevs.vercel.app/', { waitUntil: 'networkidle0' });
  const vercelHTML = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const lSpan = spans.find(s => s.textContent === 'L' && s.parentNode && s.parentNode.textContent.includes("Let's Talk"));
    return lSpan ? lSpan.outerHTML : 'Not found';
  });
  
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  const localHTML = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const lSpan = spans.find(s => s.textContent === 'L' && s.parentNode && s.parentNode.textContent.includes("Let's Talk"));
    return lSpan ? lSpan.outerHTML : 'Not found';
  });
  
  console.log('Vercel HTML:', vercelHTML);
  console.log('Local HTML:', localHTML);
  
  await browser.close();
})();
