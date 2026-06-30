const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://mhdevs.vercel.app/', { waitUntil: 'networkidle0' });
  
  // Find the Let's Talk text and get its computed font-family
  const fontInfo = await page.evaluate(() => {
    // Find a span that has class starting with something, or just search all spans
    const spans = Array.from(document.querySelectorAll('span'));
    const lSpan = spans.find(s => s.textContent === 'L' && s.parentNode && s.parentNode.textContent.includes("Let's Talk"));
    if (!lSpan) return 'Not found L span';
    
    const computedStyle = window.getComputedStyle(lSpan);
    return {
      fontFamily: computedStyle.fontFamily,
      fontStretch: computedStyle.fontStretch,
      fontWeight: computedStyle.fontWeight,
      fontSize: computedStyle.fontSize,
      width: computedStyle.width,
      display: computedStyle.display
    };
  });
  
  console.log('Vercel L font info:', fontInfo);
  
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  
  const localFontInfo = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const lSpan = spans.find(s => s.textContent === 'L' && s.parentNode && s.parentNode.textContent.includes("Let's Talk"));
    if (!lSpan) return 'Not found L span';
    
    const computedStyle = window.getComputedStyle(lSpan);
    return {
      fontFamily: computedStyle.fontFamily,
      fontStretch: computedStyle.fontStretch,
      fontWeight: computedStyle.fontWeight,
      fontSize: computedStyle.fontSize,
      width: computedStyle.width,
      display: computedStyle.display
    };
  });
  
  console.log('Local L font info:', localFontInfo);
  
  await browser.close();
})();
