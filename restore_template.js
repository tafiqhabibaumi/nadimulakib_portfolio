const fs = require('fs');

const data = JSON.parse(fs.readFileSync('portfolio_data.json', 'utf8'));
let js = fs.readFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', 'utf8');

function reverseReplace(currentVal, originalString) {
  if (!currentVal) return;
  const currentStr = JSON.stringify(currentVal);
  js = js.split(currentStr).join(JSON.stringify(originalString));
}

// Order matters slightly for overlapping strings, though here they are mostly distinct
reverseReplace(data.metadata.description.slice(0, 300), "I specialize in developing modern full-stack applications using the MERN stack with a strong focus on performance and clean architecture. I’m passionate about solving real-world problems and continuously improving my skills. Let’s connect and discuss how I can contribute to your next project.");
reverseReplace(data.hero.bio, "I build scalable, high-performance web applications with modern technologies like MERN stack, focusing on clean UI and seamless user experience.");
reverseReplace(data.general.logo, "/logo/logo.png");
reverseReplace(data.hero.role, "Software Engineer");
reverseReplace(data.hero.facebook, "https://www.facebook.com/mehedi.hasan.376594");
reverseReplace(data.general.resume_filename, "MehediHasan.pdf");
reverseReplace(data.general.resume_path, "/resume.pdf");
reverseReplace(data.general.avatar, "/images/mehedi.png");
reverseReplace(data.general.name, "Mehedi Hasan");

fs.writeFileSync('_next/static/chunks/0is~5-fx~ag7_.template.js', js, 'utf8');
console.log('Restored template JS.');
