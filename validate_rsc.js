const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const rscMatches = [...html.matchAll(/<script[^>]*>(self\.__next_f\.push\([\s\S]*?\))<\/script>/g)];
let errorCount = 0;
rscMatches.forEach((m, idx) => {
  let content = m[1];
  try {
    const arrStr = content.substring('self.__next_f.push('.length, content.length - 1);
    const parsed = JSON.parse(arrStr);
    
    // Also try to parse the inner string if it has a colon
    const innerStr = parsed[1];
    if (typeof innerStr === 'string' && innerStr.includes(':')) {
      const colonIdx = innerStr.indexOf(':');
      const innerJson = innerStr.substring(colonIdx + 1);
      JSON.parse(innerJson);
    }
  } catch(e) {
    console.log('JSON Parse Error in RSC', idx, e.message);
    console.log('Snippet:', content.substring(0, 100));
    errorCount++;
  }
});
console.log('Errors found:', errorCount);
