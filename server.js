const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  data: mongoose.Schema.Types.Mixed
}, { strict: false });
const ConfigModel = mongoose.models.Config || mongoose.model('Config', configSchema);

const MONGODB_URI = process.env.MONGODB_URI;
let dbConnected = false;

async function connectDB() {
  if (dbConnected) return;
  if (!MONGODB_URI) return;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    dbConnected = true;
    console.log("Connected to MongoDB!");
    // Seed database if empty
    const count = await ConfigModel.countDocuments();
    if (count === 0 && fs.existsSync(DATA_FILE)) {
      const initial = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      await ConfigModel.create({ data: initial });
      console.log("Database seeded with portfolio_data.json");
    }
  } catch (e) {
    console.error("MongoDB connection error:", e);
  }
}

async function getConfigData() {
  await connectDB();
  if (dbConnected) {
    const doc = await ConfigModel.findOne();
    if (doc && doc.data) return doc.data;
  }
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return {};
}

async function saveConfigData(newConfig) {
  await connectDB();
  if (dbConnected) {
    let doc = await ConfigModel.findOne();
    if (doc) {
      doc.data = newConfig;
      doc.markModified('data');
      await doc.save();
    } else {
      await ConfigModel.create({ data: newConfig });
    }
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(newConfig, null, 2));
  }
}

const PORT = process.env.PORT || 3000;
let DATA_FILE = path.join(__dirname, 'portfolio_data.json');

// Vercel serverless environment is read-only. Fallback to /tmp to prevent crashing,
// though data resets when the lambda shuts down.
if (process.env.VERCEL) {
  DATA_FILE = path.join('/tmp', 'portfolio_data.json');
  if (!fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(path.join(__dirname, 'portfolio_data.json'), DATA_FILE);
  }
}

const ADMIN_SECRET = process.env.MONGODB_URI || 'portfolio_secret_key';

// Helper to authenticate request token statelessly
async function isAuthenticated(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const config = await getConfigData();
    const savedHash = config.admin_password || '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
    const expectedToken = crypto.createHash('sha256').update(savedHash + ADMIN_SECRET).digest('hex');
    return token === expectedToken;
  }
  return false;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Compiler function: reads templates, dynamically generates components HTML, replaces SEO/variables, and saves index.html + JS chunk
function compileWebsite(originalData) {
  let data = JSON.parse(JSON.stringify(originalData));
  
  function replaceBase64WithUrl(obj, currentPath) {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key in obj) {
      const val = obj[key];
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      if (typeof val === 'string' && val.startsWith('data:')) {
        obj[key] = `/api/image?key=${newPath}`;
      } else if (typeof val === 'object') {
        replaceBase64WithUrl(val, newPath);
      }
    }
  }
  replaceBase64WithUrl(data, '');
  const templateHtmlPath = path.join(__dirname, 'index.template.html');
  const liveHtmlPath = path.join(__dirname, 'index.html');
  
  const templateJsPath = path.join(__dirname, '_next/static/chunks/0is~5-fx~ag7_.template.js');
  const liveJsPath = path.join(__dirname, '_next/static/chunks/0is~5-fx~ag7_.js');
  
  if (!fs.existsSync(templateHtmlPath)) {
    console.error("HTML Template not found during compile!");
    return false;
  }
  if (!fs.existsSync(templateJsPath)) {
    console.error("JS Template not found during compile!");
    return false;
  }
  
  let html = fs.readFileSync(templateHtmlPath, 'utf8');
  let js = fs.readFileSync(templateJsPath, 'utf8');
  
  function replaceBetween(content, start, end, replacement) {
    let result = content;
    let sIdx = result.indexOf(start);
    while (sIdx !== -1) {
      const eIdx = result.indexOf(end, sIdx + start.length);
      if (eIdx === -1) break;
      result = result.slice(0, sIdx + start.length) + replacement + result.slice(eIdx);
      sIdx = result.indexOf(start, sIdx + start.length + replacement.length + end.length);
    }
    return result;
  }
  
  // 1. Meta and SEO
  html = replaceBetween(html, '<!-- META_TITLE_START -->', '<!-- META_TITLE_END -->', `<title>${data.metadata.title}</title>`);
  html = replaceBetween(html, '<!-- META_DESC_START -->', '<!-- META_DESC_END -->', `<meta name="description" content="${data.metadata.description}"/>`);
  html = replaceBetween(html, '<!-- META_KEYS_START -->', '<!-- META_KEYS_END -->', `<meta name="keywords" content="${data.metadata.keywords}"/>`);
  html = replaceBetween(html, '<!-- META_AUTH_START -->', '<!-- META_AUTH_END -->', `<meta name="author" content="${data.metadata.author}"/>`);
  html = replaceBetween(html, '<!-- OG_TITLE_START -->', '<!-- OG_TITLE_END -->', `<meta property="og:title" content="${data.metadata.og_title}"/>`);
  html = replaceBetween(html, '<!-- OG_DESC_START -->', '<!-- OG_DESC_END -->', `<meta property="og:description" content="${data.metadata.og_description}"/>`);
  html = replaceBetween(html, '<!-- OG_URL_START -->', '<!-- OG_URL_END -->', `<meta property="og:url" content="${data.metadata.og_url}"/>`);
  html = replaceBetween(html, '<!-- OG_IMAGE_START -->', '<!-- OG_IMAGE_END -->', `<meta property="og:image" content="${data.metadata.og_image}"/>`);
  let faviconHref = data.general.favicon;
  if (originalData.general.favicon) {
    const imgHref = originalData.general.favicon.startsWith('data:') ? originalData.general.favicon : faviconHref;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><image href="${imgHref}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/></svg>`;
    faviconHref = `data:image/svg+xml;base64,${Buffer.from(svgStr).toString('base64')}`;
  }
  html = replaceBetween(html, '<!-- FAVICON_START -->', '<!-- FAVICON_END -->', `<link rel="icon" href="${faviconHref}" type="image/svg+xml"/>`);

  
  // 2. Custom CSS Styles Overrides (Primary/Secondary color themes)
  const stylesOverride = `
<style id="portfolio-styles-override">
  :root {
    --primary-color: ${data.general.primary_color};
    --secondary-color: ${data.general.secondary_color};
  }
  /* Force override color variables */
  .bg-primary { background-color: ${data.general.primary_color} !important; }
  .border-primary { border-color: ${data.general.primary_color} !important; }
  .text-primary { color: ${data.general.primary_color} !important; }
  .bg-secondary { background-color: ${data.general.secondary_color} !important; }
  .border-secondary { border-color: ${data.general.secondary_color} !important; }
  .text-secondary { color: ${data.general.secondary_color} !important; }
  .text-accent { color: ${data.general.secondary_color} !important; }
  /* Hero avatar image sizing fix */
  section#home img[data-nimg="fill"] {
    object-fit: contain !important;
    object-position: bottom center !important;
  }
  /* Navbar Logo sizing fix - use contain to fit without stretching */
  header img[alt="Logo"] {
    object-fit: contain !important;
    object-position: left center !important;
    transform: scale(3.5) !important;
    transform-origin: left center !important;
  }
  /* Qualifications Logo sizing fix to prevent pixelation/stretching */
  section#qualifications img[data-nimg="fill"] {
    object-fit: contain !important;
    object-position: center center !important;
  }
  section#home .absolute.bottom-0 {
    width: 90% !important;
    max-width: 90% !important;
  }
  @media (min-width: 768px) {
    section#home .absolute.bottom-0 {
      width: 65% !important;
      max-width: 65% !important;
    }
  }
  @media (min-width: 1024px) {
    section#home .absolute.bottom-0 {
      width: 60% !important;
      max-width: 60% !important;
    }
  }
  @media (min-width: 1280px) {
    section#home .absolute.bottom-0 {
      width: 50% !important;
      max-width: 50% !important;
    }
  }
  @media (min-width: 1536px) {
    section#home .absolute.bottom-0 {
      width: 45% !important;
      max-width: 45% !important;
    }
  }
</style>
`;
  html = replaceBetween(html, '<!-- STYLES_OVERRIDE_START -->', '<!-- STYLES_OVERRIDE_END -->', stylesOverride);
  
  // 3. Header Logo
  const logoHTML = `<img alt="Logo" loading="lazy" decoding="async" data-nimg="fill" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="100vw" srcSet="${data.general.logo}" src="${data.general.logo}"/>`;
  html = replaceBetween(html, '<!-- LOGO_START -->', '<!-- LOGO_END -->', logoHTML);
  
  // 4. Hero Content
  html = replaceBetween(html, '<!-- HERO_GREETING_START -->', '<!-- HERO_GREETING_END -->', data.general.greeting);
  html = replaceBetween(html, '<!-- HERO_NAME_START -->', '<!-- HERO_NAME_END -->', `<span class="inline-block text-5xl md:text-8xl lg:text-7xl 2xl:text-7xl" style="background-image:linear-gradient(120deg, ${data.general.secondary_color} 0%, ${data.general.secondary_color} 35%, #dad1ff 50%, ${data.general.secondary_color} 65%, ${data.general.secondary_color} 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-position:150% center">${data.general.name}</span>`);
  html = replaceBetween(html, '<!-- HERO_ROLE_START -->', '<!-- HERO_ROLE_END -->', `<h2 class="md:text-xl lg:text-base 2xl:text-3xl text-center xl:text-left">${data.hero.role}</h2>`);
  html = replaceBetween(html, '<!-- HERO_BIO_START -->', '<!-- HERO_BIO_END -->', `<p class="text-xs md:text-base lg:text-sm xl:text-base text-center xl:text-justify md:w-[90%] lg:w-[80%] lg:mx-auto xl:mx-0 2xl:w-auto">${data.hero.bio}</p>`);
  html = replaceBetween(html, '<!-- HERO_FACEBOOK_LINK_START -->', '<!-- HERO_FACEBOOK_LINK_END -->', `<a href="${data.hero.facebook}" target="_blank" rel="noopener noreferrer">`);
  html = replaceBetween(html, '<!-- RESUME_LINK_START -->', '<!-- RESUME_LINK_END -->', `<a href="${data.general.resume_path}" download="${data.general.resume_filename}">`);
  
  const avatarHTML = `<img alt="${data.general.name}" loading="lazy" decoding="async" data-nimg="fill" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-fit:contain;object-position:bottom center;color:transparent" sizes="100vw" srcSet="${data.general.avatar}" src="${data.general.avatar}"/>`;
  html = replaceBetween(html, '<!-- AVATAR_IMAGE_START -->', '<!-- AVATAR_IMAGE_END -->', avatarHTML);
  
  // 5. Ticker Section
  const tickerItemsHTML = data.ticker.map(item => {
    const word = item.text || 'Skill';
    const icon = item.icon || '/icons/html.png';
    return `
      <div class="flex items-center gap-3 md:gap-5 2xl:gap-10">
        <div class="relative h-6 2xl:h-12 w-5 md:w-10 xl:w-12 2xl:w-16 -skew-2">
          <img alt="${word}" loading="lazy" decoding="async" data-nimg="fill" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent;object-fit:contain;" sizes="100vw" src="${icon}"/>
        </div>
        <h1 class="text-sm md:text-base lg:text-xl xl:text-2xl 2xl:text-4xl font-medium -skew-2">${word}</h1>
      </div>
    `;
  }).join('');
  
  const tickerHTML = `
    <section class="relative text-black custom-ticker-wrapper" data-custom-ticker-hydrated="true">
      <div class="bg-primary absolute top-0 h-full w-full z-0 -skew-2"></div>
      <div class="relative bg-white z-10 skew-2 py-3 2xl:py-5">
        <div class="absolute top-0 left-0 w-10 md:w-16 lg:w-24 h-full bg-linear-to-r from-[#ffffff] via-[#ffffffc4] to-[#ffffff00] z-20"></div>
        <div class="flex gap-3 md:gap-5 lg:gap-10 2xl:gap-20 overflow-hidden">
          <div class="flex items-center gap-3 md:gap-5 2xl:gap-10 animate-marquee whitespace-nowrap">${tickerItemsHTML}</div>
          <div class="flex items-center gap-3 md:gap-5 2xl:gap-10 animate-marquee whitespace-nowrap">${tickerItemsHTML}</div>
        </div>
        <div class="absolute top-0 right-0 w-10 md:w-16 lg:w-24 h-full bg-linear-to-l from-[#ffffff] via-[#ffffffc4] to-[#ffffff00] z-20"></div>
      </div>
    </section>
  `;
  html = replaceBetween(html, '<!-- TICKER_START -->', '<!-- TICKER_END -->', tickerHTML);
  
  const customSocialHTML = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; gap: 5rem;">
      <div style="position: absolute; width: 2px; height: calc(100% + 4.5rem); border-left: 2px dotted ${data.general.primary_color}80; z-index: -10; top: -2.3rem;"></div>
      
      <div style="position: absolute; width: 10px; height: 10px; border-radius: 50%; background-color: ${data.general.primary_color}; top: -2.3rem; box-shadow: 0 0 10px 2px ${data.general.primary_color}b3;"></div>
      
      <div style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background-color: ${data.general.primary_color}; top: 4.8rem; box-shadow: 0 0 8px 1px ${data.general.primary_color}80;"></div>
      <div style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background-color: ${data.general.primary_color}; top: 12.3rem; box-shadow: 0 0 8px 1px ${data.general.primary_color}80;"></div>
      
      <div style="position: absolute; width: 10px; height: 10px; border-radius: 50%; background-color: ${data.general.primary_color}; bottom: -2.3rem; box-shadow: 0 0 10px 2px ${data.general.primary_color}b3;"></div>

      <a href="${data.hero.facebook || '#'}" target="_blank" class="flex items-center justify-center text-3xl border-2 border-primary p-3 rounded-full cursor-target hover:scale-125 duration-500 hover:shadow-lg" style="background-color: #030014; box-shadow: inset 0 0 0 10px #030014;">
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>
      </a>
      <a href="${data.hero.linkedin || '#'}" target="_blank" class="flex items-center justify-center text-3xl border-2 border-primary p-3 rounded-full cursor-target hover:scale-125 duration-500 hover:shadow-lg" style="background-color: #030014; box-shadow: inset 0 0 0 10px #030014;">
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"></path></svg>
      </a>
      <a href="${data.hero.instagram || '#'}" target="_blank" class="flex items-center justify-center text-3xl border-2 border-primary p-3 rounded-full cursor-target hover:scale-125 duration-500 hover:shadow-lg" style="background-color: #030014; box-shadow: inset 0 0 0 10px #030014;">
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
      </a>
    </div>`;
  html = html.replace('</body>', `<script>
      window.CUSTOM_TICKER_HTML = ${JSON.stringify(tickerItemsHTML)};
      window.CUSTOM_TICKER_SECTION_HTML = ${JSON.stringify(tickerHTML)};
      window.CUSTOM_HERO_SOCIALS_HTML = ${JSON.stringify(customSocialHTML)};
    </script></body>`);
  
  // 6. About Section
  html = replaceBetween(html, '<!-- ABOUT_TITLE_START -->', '<!-- ABOUT_TITLE_END -->', `<h1 class="text-4xl md:text-7xl lg:text-6xl font-extrabold uppercase">${data.about.title}</h1>`);
  html = replaceBetween(html, '<!-- ABOUT_SUBTITLE_START -->', '<!-- ABOUT_SUBTITLE_END -->', `<p class="text-base md:text-lg font-medium">${data.about.subtitle}</p>`);
  html = html.replace('<!-- ABOUT_RSC_SUBTITLE -->', JSON.stringify(data.about.subtitle).slice(1, -1));
  html = replaceBetween(html, '<!-- ABOUT_P1_START -->', '<!-- ABOUT_P1_END -->', `<p class="text-sm md:text-base py-5 md:py-8 text-justify">${data.about.p1}</p>`);
  html = html.replace('<!-- ABOUT_RSC_P1 -->', JSON.stringify(data.about.p1).slice(1, -1));
  html = replaceBetween(html, '<!-- ABOUT_P2_START -->', '<!-- ABOUT_P2_END -->', `<p class="text-sm md:text-base pb-5 md:pb-8 text-justify">${data.about.p2}</p>`);
  html = html.replace('<!-- ABOUT_RSC_P2 -->', JSON.stringify(data.about.p2).slice(1, -1));
  
  const bulletsHTML = `
    <ul class="p-3 md:p-5 list-inside list-disc space-y-2">
      ${data.about.bullets.map(b => `
        <li class="text-sm md:text-base lg:text-sm xl:text-base text-gray-400 text-justify">
          <span class="font-semibold text-white">${b.label}: </span>${b.text}
        </li>
      `).join('')}
    </ul>
  `;
  html = replaceBetween(html, '<!-- ABOUT_BULLETS_START -->', '<!-- ABOUT_BULLETS_END -->', bulletsHTML);
  
  const portraitHTML = `<img alt="Mehedi Hasan" loading="lazy" decoding="async" data-nimg="fill" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="100vw" src="${data.about.image}"/>`;
  html = replaceBetween(html, '<!-- ABOUT_PORTRAIT_START -->', '<!-- ABOUT_PORTRAIT_END -->', portraitHTML);
  
  // 7. Skills Orbit Section
  const brainHTML = `<img alt="Brain" loading="lazy" decoding="async" data-nimg="fill" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" sizes="100vw" src="${data.skills.brain_image}"/>`;
  html = replaceBetween(html, '<!-- BRAIN_IMAGE_START -->', '<!-- BRAIN_IMAGE_END -->', brainHTML);
  
  // Generate Inner Orbit skills elements
  const innerOrbitItems = data.skills.inner_ring.map((skill, idx, arr) => {
    const dist = (idx / arr.length) * 100;
    return `
      <div class="absolute will-change-transform select-none" style="width:120px;height:120px;offset-path:path(&quot;M 130 600 A 470 470 0 1 0 1070 600 A 470 470 0 1 0 130 600&quot;);offset-rotate:0deg;offset-anchor:center center;offset-distance:${dist}%">
        <div style="transform:rotate(8deg)">
          <img src="${skill.icon}" alt="${skill.name}" draggable="false" class="w-full h-full object-contain"/>
        </div>
      </div>
    `;
  }).join('');
  
  const innerOrbitHTML = `
    <div class="absolute left-1/2 top-1/2" style="width:1200px;height:1200px;transform:translate(-50%, -50%) scale(1);transform-origin:center center">
      <div class="relative w-full h-full" style="transform:rotate(-8deg);transform-origin:center center">
        <svg width="100%" height="100%" viewBox="0 0 1200 1200" class="absolute inset-0 pointer-events-none">
          <path d="M 130 600 A 470 470 0 1 0 1070 600 A 470 470 0 1 0 130 600" fill="none" stroke="#ffffff" stroke-width="2"></path>
        </svg>
        ${innerOrbitItems}
      </div>
    </div>
  `;
  html = replaceBetween(html, '<!-- INNER_ORBIT_START -->', '<!-- INNER_ORBIT_END -->', innerOrbitHTML);
  
  // Generate Outer Orbit skills elements
  const outerOrbitItems = data.skills.outer_ring.map((skill, idx, arr) => {
    const dist = (idx / arr.length) * 100;
    return `
      <div class="absolute will-change-transform select-none" style="width:120px;height:120px;offset-path:path(&quot;M 130 600 A 470 470 0 1 0 1070 600 A 470 470 0 1 0 130 600&quot;);offset-rotate:0deg;offset-anchor:center center;offset-distance:${dist}%">
        <div style="transform:rotate(8deg)">
          <img src="${skill.icon}" alt="${skill.name}" draggable="false" class="w-full h-full object-contain"/>
        </div>
      </div>
    `;
  }).join('');
  
  const outerOrbitHTML = `
    <div class="absolute left-1/2 top-1/2" style="width:1200px;height:1200px;transform:translate(-50%, -50%) scale(1);transform-origin:center center">
      <div class="relative w-full h-full" style="transform:rotate(-8deg);transform-origin:center center">
        <svg width="100%" height="100%" viewBox="0 0 1200 1200" class="absolute inset-0 pointer-events-none">
          <path d="M 130 600 A 470 470 0 1 0 1070 600 A 470 470 0 1 0 130 600" fill="none" stroke="#ffffff" stroke-width="2"></path>
        </svg>
        ${outerOrbitItems}
      </div>
    </div>
  `;
  html = replaceBetween(html, '<!-- OUTER_ORBIT_START -->', '<!-- OUTER_ORBIT_END -->', outerOrbitHTML);
  
  // 8. Projects List Section
  const projectsListHTML = data.projects.map((proj, idx) => {
    const numberStr = String(idx + 1).padStart(2, '0');
    return `
      <div class="py-20 lg:py-42 flex flex-col-reverse xl:flex-row gap-10 lg:gap-16 xl:gap-0">
        <div class="xl:w-[50%]">
          <div class="flex items-end">
            <h1 class="text-8xl md:text-9xl font-extrabold">${numberStr}</h1>
            <span class="py-3">
              <h1 class="text-xl md:text-3xl font-bold">${proj.title}</h1>
              <p class="text-sm md:text-base text-gray-400">${proj.subtitle}</p>
            </span>
          </div>
          <div class="text-justify md:mr-10 my-5 text-xs md:text-sm text-gray-300">
            <p>${proj.description}</p>
          </div>
          <div class="flex flex-col md:flex-row md:gap-5">
            <div class="md:w-[50%]">
              <h1 class="font-medium">Key Features</h1>
              <ul class="my-5 text-xs md:text-sm text-gray-400 list-disc list-inside space-y-2">
                ${proj.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
            <div class="md:w-[50%]">
              <h1 class="font-medium">Tech Stack</h1>
              <ul class="my-5 text-xs md:text-sm text-gray-400 list-disc list-inside space-y-2">
                <li><span class="font-semibold text-gray-200">Frontend:</span> ${proj.tech_stack.frontend}</li>
                <li><span class="font-semibold text-gray-200">Backend:</span> ${proj.tech_stack.backend}</li>
                <li><span class="font-semibold text-gray-200">Database:</span> ${proj.tech_stack.database}</li>
              </ul>
            </div>
          </div>
          <div class="mt-5 grid grid-cols-2 md:grid-cols-3 gap-2.5 xl:mr-5">
            <a href="${proj.links.client_repo}" target="_blank" rel="noopener noreferrer" class="border text-center text-xs md:text-base px-5 py-2 rounded-md hover:shadow-2xl hover:shadow-primary/50 transition-shadow duration-300 cursor-target">Client Repository</a>
            <a href="${proj.links.server_repo}" target="_blank" rel="noopener noreferrer" class="border text-center text-xs md:text-base px-5 py-2 rounded-md hover:shadow-2xl hover:shadow-primary/50 transition-shadow duration-300 cursor-target">Server Repository</a>
          </div>
        </div>
        <div class="xl:w-[50%] flex justify-center items-center">
          <figure class="relative touch-none h-full" style="perspective:500px;transform:translate3d(0, 0, 0.1px);--icon:url(/icons/code-02-01.png);--inner-gradient:linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%);--behind-glow-color:rgba(125, 190, 255, 0.67);--behind-glow-size:50%;--pointer-x:50%;--pointer-y:50%;--pointer-from-center-x:0px;--pointer-from-center-y:0px;width:min(100svw - 2.5em, 480px);height:min((100svw - 2.5em) / 0.718, 668.5px);border-radius:30px">
            <div class="select-none grid w-full h-full relative cursor-target overflow-hidden" style="border-radius:30px;background-blend-mode:color-dodge, normal, normal, normal;box-shadow:rgba(0, 0, 0, 0.8) calc((var(--pointer-from-center-x) * 10px) - 3px) calc((var(--pointer-from-center-y) * 20px) - 6px) 20px -5px;transition:transform 1s ease;transform:translateZ(0) rotateX(0deg) rotateY(0deg);background:rgba(0, 0, 0, 0.9);backface-visibility:hidden">
              <div class="absolute inset-[1px] opacity-100 bg-[#060010] z-1" style="border-radius:30px"></div>
              <img src="${proj.image}" alt="${proj.title} Project" class="absolute top-0 left-0 object-cover rounded-[15px] will-change-transform transform-[translateZ(0)]  w-full h-full"/>
              <div class="absolute top-5 right-5 shadow-2xl shadow-primary/50 z-2 will-change-transform transform-[translateZ(30px)]">
                <div class="absolute top-5 right-5 bg-white text-black rounded-full p-2.5 text-lg cursor-target">
                  <a href="${proj.links.live_site}" target="_blank" rel="noopener noreferrer">
                    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  </a>
                </div>
              </div>
            </div>
            <figcaption class="pointer-events-none absolute left-0 top-0 rounded-lg bg-white px-2.5 py-1 text-[10px] text-[#2d2d2d] opacity-0 z-3 hidden sm:block" style="opacity:0;transform:none">${proj.title} - Live Site</figcaption>
          </figure>
        </div>
      </div>
    `;
  }).join('');
  html = replaceBetween(html, '<!-- PROJECTS_LIST_START -->', '<!-- PROJECTS_LIST_END -->', projectsListHTML);
  
  // 9. Qualifications List Section
  const qualsHTML = data.qualifications.map(qual => {
    return `
      <div class="invisible ">
        <div class="relative rounded-3xl border border-neutral-800 bg-gray-200 overflow-hidden p-8 custom-spotlight-card w-full h-full hover:-translate-y-2.5 duration-500">
          <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out" style="opacity:0;background:radial-gradient(circle at 0px 0px, #b8a9f5, transparent 80%)"></div>
          <div class="text-black space-y-3 md:space-y-5">
            <div class="flex flex-col md:flex-row gap-10">
              <div class="relative w-[30%] mx-auto md:w-[20%] md:mx-0 flex items-center h-20">
                <img alt="${qual.organization}" loading="lazy" decoding="async" data-nimg="fill" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent" src="${qual.logo}"/>
              </div>
              <div class="w-full xl:w-[80%]">
                <h1 class="md:text-lg font-bold">${qual.title}</h1>
                <p class="font-medium text-gray-600 text-sm md:text-base">${qual.organization}</p>
                <p class="font-semibold text-primary text-sm md:text-base">${qual.year}</p>
              </div>
            </div>
            <div class="text-justify font-medium text-gray-700 text-sm md:text-base">
              <p>${qual.description}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  const qualsSectionHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 my-20">
      ${qualsHTML}
    </div>
  `;
  html = replaceBetween(html, '<!-- QUALS_LIST_START -->', '<!-- QUALS_LIST_END -->', qualsSectionHTML);
  
  // 10. Contact Information
  html = replaceBetween(html, '<!-- CONTACT_BIO_START -->', '<!-- CONTACT_BIO_END -->', `<p class="py-5 xl:py-10 xl:pr-36 text-justify text-gray-400 text-sm md:text-base">${data.metadata.description.slice(0, 300)}</p>`);
  html = replaceBetween(html, '<!-- CONTACT_EMAIL_START -->', '<!-- CONTACT_EMAIL_END -->', `<p>${data.general.email}</p>`);
  html = replaceBetween(html, '<!-- CONTACT_PHONE_START -->', '<!-- CONTACT_PHONE_END -->', `<p>${data.general.phone}</p>`);
  html = replaceBetween(html, '<!-- CONTACT_ADDRESS_START -->', '<!-- CONTACT_ADDRESS_END -->', `<p>${data.general.address}</p>`);
  
  // 11. Form Submission Access Key
  html = replaceBetween(html, '<!-- WEB3FORMS_KEY_START -->', '<!-- WEB3FORMS_KEY_END -->', `<input type="hidden" name="access_key" value="${data.general.web3forms_key}"/>`);
  
  // 12. Footer Copyright
  html = replaceBetween(html, '<!-- COPYRIGHT_START -->', '<!-- COPYRIGHT_END -->', `<h1 class="text-xs md:text-base">${data.general.copyright}</h1>`);
  
  const footerSocialLinksHTML = `
    <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      <a href="${data.hero.github}" target="_blank" class="border px-5 py-2 md:px-16 md:py-4 text-center text-lg uppercase rounded-full cursor-target hover:shadow-2xl hover:shadow-primary/50 duration-300">github</a>
      <a href="${data.hero.linkedin}" target="_blank" class="border px-5 py-2 md:px-16 md:py-4 text-center text-lg uppercase rounded-full cursor-target hover:shadow-2xl hover:shadow-primary/50 duration-300">linkedin</a>
      <a href="${data.hero.facebook}" target="_blank" class="border px-5 py-2 md:px-16 md:py-4 text-center text-lg uppercase rounded-full cursor-target hover:shadow-2xl hover:shadow-primary/50 duration-300">facebook</a>
    </div>
  `;
  html = replaceBetween(html, '<!-- FOOTER_SOCIAL_LINKS_START -->', '<!-- FOOTER_SOCIAL_LINKS_END -->', footerSocialLinksHTML);
  
  // ==========================================
  // HYDRATION PAYLOAD REPLACEMENTS (RSC)
  // ==========================================
  
  function updateRSCBlock(htmlContent, searchKey, updateFn) {
    const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      const scriptContent = match[1];
      if (scriptContent.includes('self.__next_f.push') && scriptContent.includes(searchKey)) {
        const pushMatch = scriptContent.match(/self\.__next_f\.push\(([\s\S]*)\)/);
        if (pushMatch) {
          try {
            const arr = new Function(`return ${pushMatch[1]}`)();
            const rawStr = arr[1];
            const colonIdx = rawStr.indexOf(':');
            if (colonIdx !== -1) {
              const id = rawStr.slice(0, colonIdx);
              const jsonStr = rawStr.slice(colonIdx + 1);
              const parsedObj = JSON.parse(jsonStr);
              const updatedObj = updateFn(parsedObj);
              const newJsonStr = JSON.stringify(updatedObj);
              const newRawStr = id + ':' + newJsonStr + '\n';
              const newPushArg = `[${arr[0]},${JSON.stringify(newRawStr)}]`;
              const newScriptTag = `<script>self.__next_f.push(${newPushArg})</script>`;
              htmlContent = htmlContent.replace(match[0], () => newScriptTag);
            }
          } catch (e) {
            console.error(`Failed to update RSC block with searchKey "${searchKey}":`, e.message);
          }
        }
      }
    }
    return htmlContent;
  }

  function updateMultiLineRSCBlock(htmlContent, searchKey, lineUpdates) {
    const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      const scriptContent = match[1];
      if (scriptContent.includes('self.__next_f.push') && scriptContent.includes(searchKey)) {
        const pushMatch = scriptContent.match(/self\.__next_f\.push\(([\s\S]*)\)/);
        if (pushMatch) {
          try {
            const arr = new Function(`return ${pushMatch[1]}`)();
            const rawStr = arr[1];
            const lines = rawStr.split('\n');
            const newLines = lines.map(line => {
              if (!line.trim()) return line;
              const colonIdx = line.indexOf(':');
              if (colonIdx === -1) return line;
              const id = line.slice(0, colonIdx);
              const content = line.slice(colonIdx + 1);
              if (lineUpdates[id]) {
                try {
                  const parsed = JSON.parse(content);
                  const updated = lineUpdates[id](parsed);
                  return id + ':' + JSON.stringify(updated);
                } catch (e) {
                  return id + ':' + lineUpdates[id](content);
                }
              }
              return line;
            });
            const newRawStr = newLines.join('\n');
            const newPushArg = `[${arr[0]},${JSON.stringify(newRawStr)}]`;
            const newScriptTag = `<script>self.__next_f.push(${newPushArg})</script>`;
            htmlContent = htmlContent.replace(match[0], () => newScriptTag);
          } catch (e) {
            console.error(`Failed to update multi-line RSC block:`, e.message);
          }
        }
      }
    }
    return htmlContent;
  }

  // A. Update SEO Metadata (Script ID 28)
  html = updateRSCBlock(html, 'MH.dev | Mehedi Hasan', (metaNode) => {
    function walkAndReplace(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node[0] === '$') {
          const type = node[1];
          const props = node[3];
          if (props) {
            if (type === 'title') { props.children = data.metadata.title; return; }
            if (type === 'meta') {
              if (props.name === 'description') { props.content = data.metadata.description; return; }
              if (props.name === 'keywords') { props.content = data.metadata.keywords; return; }
              if (props.name === 'author') { props.content = data.metadata.author; return; }
              if (props.name === 'creator') { props.content = data.metadata.author; return; }
              if (props.property === 'og:title') { props.content = data.metadata.og_title; return; }
              if (props.property === 'og:description') { props.content = data.metadata.og_description; return; }
              if (props.property === 'og:url') { props.content = data.metadata.og_url; return; }
              if (props.property === 'og:image') { props.content = data.metadata.og_image; return; }
              if (props.name === 'twitter:title') { props.content = data.metadata.og_title; return; }
              if (props.name === 'twitter:description') { props.content = data.metadata.og_description; return; }
              if (props.name === 'twitter:image') { props.content = data.metadata.og_image; return; }
            }
            if (type === 'link' && props.rel === 'icon') {
              props.href = data.general.favicon;
              return;
            }
          }
        }
        node.forEach(walkAndReplace);
      } else {
        Object.keys(node).forEach(k => walkAndReplace(node[k]));
      }
    }
    walkAndReplace(metaNode);
    return metaNode;
  });

  // A2. Update Hero and Home layout elements (Script ID 0)
  html = updateRSCBlock(html, '0:\\"{\\"P\\"', (heroNode) => {
    function walkAndReplace(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node[0] === '$') {
          const type = node[1];
          const props = node[3];
          if (props) {
            // Facebook link
            if (type === 'a' && props.href === 'https://www.facebook.com/mehedi.hasan.376594') {
              props.href = data.hero.facebook;
              return;
            }
            // Resume download link
            if (type === 'a' && props.download === 'MehediHasan.pdf') {
              props.href = data.general.resume_path;
              props.download = data.general.resume_filename;
              return;
            }
            // Hero profile image
            if (props.src === '/images/mehedi.png' && props.alt === 'Mehedi') {
              props.src = data.general.avatar;
              props.alt = data.general.name;
              return;
            }
            // Logo image
            if (props.src === '/logo/logo.png' && props.alt === 'Logo') {
              props.src = data.general.logo;
              return;
            }
            // Hero Role
            if (type === 'h2' && props.className === 'md:text-xl lg:text-base 2xl:text-3xl text-center xl:text-left') {
              props.children = data.hero.role;
              return;
            }
            // Hero Bio
            if (type === 'p' && props.className === 'text-xs md:text-base lg:text-sm xl:text-base text-center xl:text-justify md:w-[90%] lg:w-[80%] lg:mx-auto xl:mx-0 2xl:w-auto') {
              props.children = data.hero.bio;
              return;
            }
            // Greeting
            if (type === 'h1' && props.className && props.className.includes('xl:leading-20')) {
              const brIdx = props.children.findIndex(child => Array.isArray(child) && child[1] === 'br');
              if (brIdx !== -1) {
                props.children.splice(0, brIdx, data.general.greeting);
              }
              return;
            }
          }
        }
        node.forEach(walkAndReplace);
      } else {
        Object.keys(node).forEach(k => walkAndReplace(node[k]));
      }
    }
    walkAndReplace(heroNode);
    return heroNode;
  });

  // B. Update About Section (Script ID c / id="about")
  html = updateRSCBlock(html, 'id\\":\\"about\\"', (aboutNode) => {
    function walkAndReplace(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node[0] === '$') {
          const type = node[1];
          const props = node[3];
          if (props) {
            if (type === 'h1' && props.children === 'about.') { props.children = data.about.title; return; }
            if (type === 'p' && props.className === 'text-base md:text-lg font-medium') { props.children = data.about.subtitle; return; }
            if (type === 'p' && props.className === 'text-sm md:text-base py-5 md:py-8 text-justify') { props.children = data.about.p1; return; }
            if (props.name === 'Mehedi Hasan' && props.avatarUrl) {
              props.name = data.general.name;
              props.handle = data.general.name;
              props.title = data.hero.role;
              props.avatarUrl = data.about.image;
              return;
            }
            if (type === 'ul' && props.className && props.className.includes('list-inside list-disc')) {
              props.children = data.about.bullets.map((b, idx) => [
                "$", "li", String(idx), {
                  "className": "text-sm md:text-base lg:text-sm xl:text-base text-gray-400 text-justify",
                  "children": [
                    ["$", "span", null, {
                      "className": "font-semibold text-white",
                      "children": [b.label, ":", " "]
                    }],
                    b.text
                  ]
                }
              ]);
              return;
            }
          }
        }
        node.forEach(walkAndReplace);
      } else {
        Object.keys(node).forEach(k => walkAndReplace(node[k]));
      }
    }
    walkAndReplace(aboutNode);
    return aboutNode;
  });

  // C. Update Skills Orbits (Script ID d / id="skills")
  html = updateRSCBlock(html, 'id\\":\\"skills\\"', (skillsNode) => {
    function walkAndReplace(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node[0] === '$') {
          const props = node[3];
          if (props) {
            if (props.images && Array.isArray(props.images)) {
              if (props.direction === 'normal') { props.images = data.skills.inner_ring.map(s => s.icon); return; }
              if (props.direction === 'reverse') { props.images = data.skills.outer_ring.map(s => s.icon); return; }
            }
            if (props.src === '/images/brain.png') { props.src = data.skills.brain_image; return; }
          }
        }
        node.forEach(walkAndReplace);
      } else {
        Object.keys(node).forEach(k => walkAndReplace(node[k]));
      }
    }
    walkAndReplace(skillsNode);
    return skillsNode;
  });

  // D. Update Projects (Script ID e / id="projects")
  html = updateRSCBlock(html, 'id\\":\\"projects\\"', (projectsNode) => {
    const proj = data.projects[0];
    function walkAndReplace(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node[0] === '$') {
          const type = node[1];
          const props = node[3];
          if (props) {
            if (type === 'h1' && props.children === 'Laivaly') {
              props.children = proj.title;
              return;
            }
            if (type === 'p' && props.children === 'A modern full-stack clothing e-commerce platform') {
              props.children = proj.subtitle;
              return;
            }
            if (type === 'p' && props.children && typeof props.children === 'string' && props.children.startsWith('Laivaly is a full-stack clothing')) {
              props.children = proj.description;
              return;
            }
            if (type === 'ul' && props.className && props.className.includes('my-5 text-xs md:text-sm text-gray-400 list-disc')) {
              const isKeyFeatures = props.children && props.children[0] &&
                                    (!Array.isArray(props.children[0][3].children) ||
                                     props.children[0][3].children[0][1] !== 'span');
              if (isKeyFeatures) {
                props.children = proj.features.map((feat) => ["$", "li", null, { children: feat }]);
                return;
              }
            }
            if (type === 'li' && props.children && Array.isArray(props.children) && props.children[0] && props.children[0][3] && props.children[0][3].children === 'Frontend:') {
              props.children[2] = proj.tech_stack.frontend;
              return;
            }
            if (type === 'li' && props.children && Array.isArray(props.children) && props.children[0] && props.children[0][3] && props.children[0][3].children === 'Backend:') {
              props.children[2] = proj.tech_stack.backend;
              return;
            }
            if (type === 'li' && props.children && Array.isArray(props.children) && props.children[0] && props.children[0][3] && props.children[0][3].children === 'Database:') {
              props.children[2] = proj.tech_stack.database;
              return;
            }
            if (type === 'a' && props.children === 'Client Repository') {
              props.href = proj.links.client_repo;
              return;
            }
            if (type === 'a' && props.children === 'Server Repository') {
              props.href = proj.links.server_repo;
              return;
            }
          }
        }
        node.forEach(walkAndReplace);
      } else {
        Object.keys(node).forEach(k => walkAndReplace(node[k]));
      }
    }
    walkAndReplace(projectsNode);
    return projectsNode;
  });

  // E. Update Qualifications Timeline (Script ID 10 / id="qualifications")
  html = updateRSCBlock(html, 'id\\":\\"qualifications\\"', (qualsNode) => {
    const ssc = data.qualifications[0];
    const hsc = data.qualifications[1];
    
    function walkAndReplace(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node[0] === '$') {
          const type = node[1];
          const props = node[3];
          if (props) {
            // Card 0 (SSC) replacements
            if (type === 'h1' && props.children === 'Secondary School Certificate (SSC)') {
              props.children = ssc.title; return;
            }
            if (type === 'p' && props.children === 'Haider Ali High School and College') {
              props.children = ssc.organization; return;
            }
            if (type === 'p' && props.children === '2016-2018') {
              props.children = ssc.year; return;
            }
            if (type === 'p' && props.children && typeof props.children === 'string' && props.children.startsWith('Completed secondary education with a Science background')) {
              props.children = ssc.description; return;
            }
            if (props.alt === 'Haider Ali High School and College') {
              props.src = ssc.logo;
              props.alt = ssc.organization;
              return;
            }
            
            // Card 1 (HSC) replacements
            if (type === 'h1' && props.children === 'Higher Secondary Certificate (HSC)') {
              props.children = hsc.title; return;
            }
            if (type === 'p' && props.children === 'Uttara High School and College') {
              props.children = hsc.organization; return;
            }
            if (type === 'p' && props.children === '2018-2020') {
              props.children = hsc.year; return;
            }
            if (type === 'p' && props.children && typeof props.children === 'string' && props.children.startsWith('Continued academic journey in Science')) {
              props.children = hsc.description; return;
            }
            if (props.alt === 'Uttara High School and College') {
              props.src = hsc.logo;
              props.alt = hsc.organization;
              return;
            }
          }
        }
        node.forEach(walkAndReplace);
      } else {
        Object.keys(node).forEach(k => walkAndReplace(node[k]));
      }
    }
    walkAndReplace(qualsNode);
    return qualsNode;
  });

  // F. Update multi-line script 29 in-place (handles projects card 1b, live demo link 1a, and qualifications UU card 1e + 1f)
  const proj29 = data.projects[0];
  const bsc = data.qualifications[2]; // Uttara University
  const lineUpdates = {
    '1a': (val) => {
      if (val && val[3]) val[3].href = proj29.links.live_site;
      return val;
    },
    '1b': (val) => {
      try {
        const componentProps = val[3].children[3];
        componentProps.imageSrc = proj29.image;
        componentProps.altText = `${proj29.title} Project`;
        componentProps.captionText = `${proj29.title} - Live Site`;
        const overlayLink = componentProps.overlayContent[3].children[3];
        overlayLink.href = proj29.links.live_site;
      } catch (e) {
        console.error("Failed to update project 1b in Script 29:", e.message);
      }
      return val;
    },
    '1e': (val) => {
      function walkAndReplace(node) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          if (node[0] === '$') {
            const type = node[1];
            const props = node[3];
            if (props) {
              if (type === 'h1' && props.children === 'Bachelor of Science in Computer Science and Engineering') {
                props.children = bsc.title; return;
              }
              if (type === 'p' && props.children === 'Uttara University') {
                props.children = bsc.organization; return;
              }
              if (type === 'p' && props.children === '2022-2026') {
                props.children = bsc.year; return;
              }
              if (props.alt === 'Uttara University') {
                props.src = bsc.logo;
                props.alt = bsc.organization;
                return;
              }
            }
          }
          node.forEach(walkAndReplace);
        } else {
          Object.keys(node).forEach(k => walkAndReplace(node[k]));
        }
      }
      walkAndReplace(val);
      return val;
    },
    '1f': (val) => {
      try {
        val[3].children[3].children = bsc.description;
      } catch (e) {
        console.error("Failed to update description 1f in Script 29:", e.message);
      }
      return val;
    }
  };
  html = updateMultiLineRSCBlock(html, '29:I[6984', lineUpdates);

  // G. Update Footer Copyright and Links (Script ID 12 / footer tag)
  html = updateRSCBlock(html, '12:[\\"$\\",\\"footer\\"', (footerNode) => {
    function walkAndReplace(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node[0] === '$') {
          const type = node[1];
          const props = node[3];
          if (props) {
            if (type === 'h1' && props.className === 'text-xs md:text-base' && Array.isArray(props.children)) {
              props.children[2] = " " + data.general.name + ". All rights reserved.";
            }
            if (type === 'span' && props.className === 'md:text-lg font-semibold text-white' && props.children === 'Mehedi Hasan') {
              props.children = data.general.name;
            }
            if (type === 'a' && props.target === '_blank') {
              if (props.children === 'github') props.href = data.hero.github;
              if (props.children === 'linkedin') props.href = data.hero.linkedin;
              if (props.children === 'facebook') props.href = data.hero.facebook;
            }
          }
        }
        node.forEach(walkAndReplace);
      } else {
        Object.keys(node).forEach(k => walkAndReplace(node[k]));
      }
    }
    walkAndReplace(footerNode);
    return footerNode;
  });

  // Replace remaining hardcoded profile text & image in static HTML to match client components hydration props
  html = html.replace(/Mehedi Hasan/g, data.general.name);
  html = html.replace(/Software Engineer/g, data.hero.role);
    html = html.replace(/%2Fimages%2Fmehedi2\.png/g, encodeURIComponent(data.about.image));
    
    html = html.replace(/\/images\/mehedi\.png/g, data.general.avatar);
    html = html.replace(/%2Fimages%2Fmehedi\.png/g, encodeURIComponent(data.general.avatar));
    
    html = html.replace(/\/images\/mehedi\.png/g, data.general.avatar);
    html = html.replace(/%2Fimages%2Fmehedi\.png/g, encodeURIComponent(data.general.avatar));
    
    html = html.replace(/\/logo\/logo\.png/g, data.general.logo);
    html = html.replace(/%2Flogo%2Flogo\.png/g, encodeURIComponent(data.general.logo));
    
    html = html.replace(/\/images\/brain\.png/g, data.skills.brain_image);
    html = html.replace(/%2Fimages%2Fbrain\.png/g, encodeURIComponent(data.skills.brain_image));
    html = html.replace(/"WEB3FORMS_KEY_INJECTED_HERE"/g, `"${data.general.web3forms_key || ''}"`);

    const hideCSS = `<style>
      a[href="${data.hero.github}"] { display: none !important; }
      a[href="${data.projects[0]?.links?.client_repo}"] { display: none !important; }
      a[href="${data.projects[0]?.links?.server_repo}"] { display: none !important; }
    </style>`;
    html = html.replace('</head>', `${hideCSS}</head>`);

  // Write compiled HTML
  if (!process.env.VERCEL) {
    fs.writeFileSync(liveHtmlPath, html);
  }
  
  // 13. JS Hydration replacements
  js = js.replace(/"Mehedi Hasan"/g, JSON.stringify(data.general.name));
  js = js.replace(/"Software Engineer"/g, JSON.stringify(data.hero.role));
  js = js.replace(/"Mehedi"/g, JSON.stringify(data.general.name));
  js = js.replace(/"\/images\/mehedi\.png"/g, JSON.stringify(data.general.avatar));
  js = js.replace(/"\/resume\.pdf"/g, JSON.stringify(data.general.resume_path));
  js = js.replace(/"MehediHasan\.pdf"/g, JSON.stringify(data.general.resume_filename));
  js = js.replace(/"https:\/\/www\.facebook\.com\/mehedi\.hasan\.376594"/g, JSON.stringify(data.hero.facebook));
  
  // Additional bundle hardcoded overrides
  js = js.replace(/"A MERN-Stack Web Developer"/g, JSON.stringify(data.hero.role));
  js = js.replace(/"Software Engineer"/g, JSON.stringify(data.hero.role));
  js = js.replace(/"\/logo\/logo\.png"/g, JSON.stringify(data.general.logo));
  js = js.replace(/"I build scalable, high-performance web applications with modern technologies like MERN stack, focusing on clean UI and seamless user experience\."/g, JSON.stringify(data.hero.bio));
  js = js.replace(/"I specialize in developing modern full-stack applications using the MERN stack with a strong focus on performance and clean architecture\. I’m passionate about solving real-world problems and continuously improving my skills\. Let’s connect and discuss how I can contribute to your next project\."/g, JSON.stringify(data.metadata.description.slice(0, 300)));
  
  // Write compiled client JS
  if (!process.env.VERCEL) {
    fs.writeFileSync(liveJsPath, js);
  }
  
  
  console.log("Successfully compiled portfolio files!");
    return { html, js };
  }
  
  let CACHED_HTML = null;
  let CACHED_JS = null;

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    const method = req.method;

    // Next.js Image Optimization emulation (Must happen before API Routing so /api/image works)
    if (pathname === '/_next/image') {
      const imageUrl = parsedUrl.query.url;
      if (imageUrl) {
        // Rewrite the URL so it can be handled by API routes or static files
        req.url = imageUrl;
        const rewrittenUrl = url.parse(req.url, true);
        pathname = rewrittenUrl.pathname;
        Object.assign(parsedUrl.query, rewrittenUrl.query);
      }
    }

  // ==========================================
  // API ROUTING
  // ==========================================

  // 1. Admin Login
  if (method === 'POST' && pathname === '/api/login') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { password } = JSON.parse(body);
        const config = await getConfigData();
        const savedHash = config.admin_password || '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // Default: admin123
        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        
        if (inputHash === savedHash) {
          const token = crypto.createHash('sha256').update(savedHash + ADMIN_SECRET).digest('hex');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, token }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

    // 1.5 Image Serving Route (for base64 stored in MongoDB)
    if (method === 'GET' && pathname === '/api/image') {
      const key = parsedUrl.query.key;
      if (!key) {
        res.writeHead(400); return res.end();
      }
      try {
        const config = await getConfigData();
        const parts = key.split('.');
        let val = config;
        for (const p of parts) { if (val) val = val[p]; }
        
        if (typeof val === 'string' && val.startsWith('data:')) {
          const matches = val.match(/^data:([A-Za-z0-9\-+\/\.]+);base64,([\s\S]+)$/);
          if (matches && matches.length === 3) {
            const buffer = Buffer.from(matches[2], 'base64');
            res.writeHead(200, {
              'Content-Type': matches[1],
              'Cache-Control': 'public, max-age=31536000'
            });
            return res.end(buffer);
          }
        }
        res.writeHead(404); res.end('Not Found');
      } catch (e) {
        res.writeHead(500); res.end();
      }
      return;
    }
  
    // 2. Fetch Config (Public-safe)
  if (method === 'GET' && pathname === '/api/config') {
    try {
      const config = await getConfigData();
      delete config.admin_password; // Strip password
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(config));
    } catch (e) {
      console.error('Fetch config error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Config parse failed' }));
    }
    return;
  }

  // 3. Save Config (Authenticated)
  if (method === 'POST' && pathname === '/api/config') {
    if (!(await isAuthenticated(req))) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const newConfig = JSON.parse(body);
        let currentConfig = await getConfigData();

        // Handle password change if requested
        if (newConfig.new_password && newConfig.new_password.trim() !== '') {
          newConfig.admin_password = crypto.createHash('sha256').update(newConfig.new_password.trim()).digest('hex');
        } else {
          newConfig.admin_password = currentConfig.admin_password || '240eb51836772fa72492d7b851b37f5f84852c00224d0398687a718d7ef20d20';
        }
        delete newConfig.new_password;

        // Write config back to MongoDB
        await saveConfigData(newConfig);
        
        CACHED_HTML = null;
        CACHED_JS = null;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Settings saved and page compiled successfully.' }));
      } catch (e) {
        console.error('Config save error:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 4. File Asset Upload (Authenticated)
  if (method === 'POST' && pathname === '/api/upload') {
    if (!(await isAuthenticated(req))) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { uploadKey, fileName, fileData } = JSON.parse(body);
        if (!uploadKey || !fileName || !fileData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Missing parameters' }));
        }
        const matches = fileData.match(/^data:([A-Za-z0-9\-+\/\.]+);base64,([\s\S]+)$/);
        if (!matches || matches.length !== 3) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid base64 encoding' }));
        }

        if (fileData.length > 4000000) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'File is too large! Please upload an image under 3MB.' }));
        }

        // Return the base64 data URI directly to be saved in MongoDB config!
        // This avoids the Vercel read-only filesystem and transient /tmp storage issues.
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, filePath: fileData }));
      } catch (e) {
        console.error('File upload error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 5. Contact Form Submission Forwarder
  if (method === 'POST' && pathname === '/api/contact') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const formData = JSON.parse(body);
        const config = await getConfigData();
        
        const key = config.general ? config.general.web3forms_key : '';
        if (!key) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'Form submitted successfully (Mock mode).' }));
        }

        // Forward to Web3Forms https POST
        const https = require('https');
        const postData = JSON.stringify({
          access_key: key,
          name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
          email: formData.email,
          subject: formData.subject || 'Portfolio Message',
          message: formData.message
        });

        const options = {
          hostname: 'api.web3forms.com',
          port: 443,
          path: '/submit',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const forwardReq = https.request(options, (forwardRes) => {
          let responseBody = '';
          forwardRes.on('data', (d) => { responseBody += d; });
          forwardRes.on('end', () => {
            res.writeHead(forwardRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(responseBody);
          });
        });

        forwardReq.on('error', (e) => {
          console.error('Web3Forms forwarding error:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Web3Forms forwarding failed' }));
        });

        forwardReq.write(postData);
        forwardReq.end();

      } catch (e) {
        console.error('Contact form endpoint error:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // ==========================================
  // STATIC ASSETS AND PAGES ROUTING
  // ==========================================

  // Prevent directory traversal attacks
  pathname = pathname.replace(/^(\.\.[\/\\])+/, '');

  let filePath = path.join(__dirname, pathname);

  // Serve admin page
  if (pathname === '/admin') {
    filePath = path.join(__dirname, 'admin.html');
  } else if (pathname === '/' || pathname === '' || pathname === '/index.html') {
    if (CACHED_HTML) {
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=3600'
      });
      return res.end(CACHED_HTML);
    }
    getConfigData().then(configData => {
      const compiled = compileWebsite(configData);
      if (compiled && compiled.html) {
        CACHED_HTML = compiled.html;
        CACHED_JS = compiled.js;
        res.writeHead(200, { 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=3600'
        });
        res.end(compiled.html);
      } else {
        serve500(res);
      }
    }).catch(err => {
      console.error(err);
      serve500(res);
    });
    return;
  } else if (pathname === '/_next/static/chunks/0is~5-fx~ag7_.js') {
    if (CACHED_JS) {
      res.writeHead(200, { 
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=3600'
      });
      return res.end(CACHED_JS);
    }
    getConfigData().then(configData => {
      const compiled = compileWebsite(configData);
      if (compiled && compiled.js) {
        CACHED_HTML = compiled.html;
        CACHED_JS = compiled.js;
        res.writeHead(200, { 
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=3600'
        });
        res.end(compiled.js);
      } else {
        serve500(res);
      }
    }).catch(err => {
      console.error(err);
      serve500(res);
    });
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback clean URLs (no extension) to index.html (Next.js SPA routing)
      const ext = path.extname(pathname);
      if (!ext) {
        filePath = path.join(__dirname, 'index.html');
        fs.stat(filePath, (errIndex, statsIndex) => {
          if (!errIndex && statsIndex.isFile()) {
            serveFile(filePath, res);
          } else {
            serve404(res);
          }
        });
      } else {
        serve404(res);
      }
    } else {
      serveFile(filePath, res);
    }
  });
});

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading file:", filePath, err);
      if (!res.headersSent) {
        serve500(res);
      } else {
        res.end();
      }
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 
      'Content-Type': contentType, 
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000, immutable'
    });
    res.end(data);
  });
}

function serve404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

function serve500(res) {
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('500 Internal Server Error');
}

// Compile the initial website output on startup
connectDB().then(async () => {
  const config = await getConfigData();
  if (Object.keys(config).length > 0) {
    try {
      compileWebsite(config);
    } catch (e) {
      console.error("Failed to compile website on start:", e);
    }
  }

  if (!process.env.VERCEL) {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Admin Dashboard running at http://localhost:${PORT}/admin`);
    });
  }
});

// Export handler for Vercel
module.exports = async (req, res) => {
  server.emit('request', req, res);
};
