const fs = require('fs');

// Fix both index.template.html and index.html
const files = ['index.template.html', 'index.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Replace the @font-face block with @import for Roboto Flex (matching production)
  const oldFontFace = `@font-face {
          font-family: 'Compressa VF';
          src: url('https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2');
          font-style: normal;
        }`;
  
  const newFontImport = `@import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap');`;
  
  if (content.includes(oldFontFace)) {
    content = content.replace(oldFontFace, newFontImport);
    console.log(`[${file}] Replaced @font-face with @import for Roboto Flex`);
  } else {
    console.log(`[${file}] @font-face block not found (may already be fixed)`);
  }
  
  // 2. Replace font-family:Compressa VF with font-family:Roboto Flex in the prerendered h1 style
  if (content.includes('font-family:Compressa VF')) {
    content = content.replaceAll('font-family:Compressa VF', 'font-family:Roboto Flex');
    console.log(`[${file}] Replaced font-family:Compressa VF -> Roboto Flex in inline styles`);
  } else {
    console.log(`[${file}] font-family:Compressa VF not found in inline styles`);
  }
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`[${file}] Saved!`);
}

// Verify the fix
const verifyHtml = fs.readFileSync('index.html', 'utf8');
console.log('\n--- VERIFICATION ---');
console.log('Contains Compressa VF:', verifyHtml.includes('Compressa VF'));
console.log('Contains Roboto Flex (inline style):', verifyHtml.includes('font-family:Roboto Flex'));
console.log('Contains @import Roboto Flex:', verifyHtml.includes("@import url('https://fonts.googleapis.com/css2?family=Roboto+Flex"));

// Check RSC payload still has Roboto Flex
const rscIdx = verifyHtml.indexOf('"fontFamily":"Roboto Flex"') || verifyHtml.indexOf('\\"fontFamily\\":\\"Roboto Flex\\"');
console.log('RSC payload has Roboto Flex:', rscIdx !== -1);
