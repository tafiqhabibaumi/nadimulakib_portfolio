const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.template.html');
let content = fs.readFileSync(filePath, 'utf8');

const css = `
<style id="glass-nav-override">
  /* Force the header to be transparent when not scrolled */
  html:not(.scrolled) header {
    background-color: transparent !important;
    border-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
  }
  
  /* Ensure smooth transition */
  header {
    transition: background-color 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease, -webkit-backdrop-filter 0.3s ease !important;
  }
</style>
`;

const js = `
<script id="glass-nav-script">
  (function() {
    function updateScroll() {
      if (window.scrollY > 50) {
        document.documentElement.classList.add('scrolled');
      } else {
        document.documentElement.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', updateScroll);
    updateScroll();
    
    // Also run on React hydration or DOM changes just to be safe
    const observer = new MutationObserver(() => {
      updateScroll();
      // Apply cursor-target to all navbar buttons
      const navItems = document.querySelectorAll('nav ul li, header a, header img');
      navItems.forEach(el => {
        if (!el.classList.contains('cursor-target')) {
          el.classList.add('cursor-target');
        }
      });
      
      // Ticker hydration override
      if (window.CUSTOM_TICKER_SECTION_HTML) {
        const homeSection = document.getElementById('home');
        if (homeSection && homeSection.nextElementSibling) {
          const tickerSec1 = homeSection.nextElementSibling;
          if (tickerSec1.getAttribute('data-custom-ticker-hydrated') !== 'true') {
            tickerSec1.outerHTML = window.CUSTOM_TICKER_SECTION_HTML;
          }
        }
        
        const projectsSection = document.getElementById('projects');
        if (projectsSection && projectsSection.nextElementSibling) {
          const tickerSec2 = projectsSection.nextElementSibling;
          if (tickerSec2.getAttribute('data-custom-ticker-hydrated') !== 'true') {
            tickerSec2.outerHTML = window.CUSTOM_TICKER_SECTION_HTML;
          }
        }
      }
      
      // Hero Socials hydration override
      if (window.CUSTOM_HERO_SOCIALS_HTML) {
        const socialContainer = document.querySelector('.space-y-20.pointer-events-auto');
        if (socialContainer && socialContainer.getAttribute('data-custom-socials-hydrated') !== 'true') {
          socialContainer.innerHTML = window.CUSTOM_HERO_SOCIALS_HTML;
          socialContainer.setAttribute('data-custom-socials-hydrated', 'true');
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();
</script>
`;

// Remove previous overrides if they exist
content = content.replace(/<style id="glass-nav-override">.*?<\/style>/gs, '');
content = content.replace(/<script id="glass-nav-script">.*?<\/script>/gs, '');

// Inject CSS before </head>
if (content.includes('</head>')) {
  content = content.replace('</head>', css + '</head>');
} else {
  // fallback
  content = content.replace('<!-- STYLES_OVERRIDE_END -->', css + '<!-- STYLES_OVERRIDE_END -->');
}

// Inject JS before </body>
content = content.replace('</body>', js + '</body>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated index.template.html');
