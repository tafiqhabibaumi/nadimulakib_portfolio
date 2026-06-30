const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://mhdevs.vercel.app/', { waitUntil: 'networkidle0' });
  
  const vHoverHTML = await page.evaluate(async () => {
    const spans = Array.from(document.querySelectorAll('span'));
    const lSpan = spans.find(s => s.textContent === 'L' && s.parentNode && s.parentNode.textContent.includes("Let's Talk"));
    if (!lSpan) return 'Not found';
    
    // Trigger mouse enter
    const container = lSpan.parentNode.parentNode;
    container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: lSpan.getBoundingClientRect().x, clientY: lSpan.getBoundingClientRect().y, bubbles: true }));
    
    await new Promise(r => setTimeout(r, 500));
    return lSpan.outerHTML;
  });
  
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  
  const lHoverHTML = await page.evaluate(async () => {
    const spans = Array.from(document.querySelectorAll('span'));
    const lSpan = spans.find(s => s.textContent === 'L' && s.parentNode && s.parentNode.textContent.includes("Let's Talk"));
    if (!lSpan) return 'Not found';
    
    const container = lSpan.parentNode.parentNode;
    container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: lSpan.getBoundingClientRect().x, clientY: lSpan.getBoundingClientRect().y, bubbles: true }));
    
    await new Promise(r => setTimeout(r, 500));
    return lSpan.outerHTML;
  });
  
  console.log('Vercel Hover HTML:', vHoverHTML);
  console.log('Local Hover HTML:', lHoverHTML);
  
  await browser.close();
})();
