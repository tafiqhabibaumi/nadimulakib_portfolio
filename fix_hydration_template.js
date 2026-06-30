const fs = require('fs');
let html = fs.readFileSync('index.template.html', 'utf8');

// Move STYLES_OVERRIDE
const overrideMatch = html.match(/<!-- STYLES_OVERRIDE_START -->[\s\S]*?<!-- STYLES_OVERRIDE_END -->/);
if (overrideMatch) {
  html = html.replace(overrideMatch[0], '');
  html = html.replace('</body>', overrideMatch[0] + '</body>');
}

// Move custom styles and scripts at the end of head
const endHeadContent = html.match(/<style>\s*a\[href="https:\/\/github\.com\/mhdevs"\][\s\S]*?<\/script>\s*<\/head>/);
if (endHeadContent) {
  const extracted = endHeadContent[0].replace('</head>', '');
  html = html.replace(endHeadContent[0], '</head>');
  html = html.replace('</body>', extracted + '</body>');
}

fs.writeFileSync('index.template.html', html, 'utf8');
console.log('Fixed index.template.html');
