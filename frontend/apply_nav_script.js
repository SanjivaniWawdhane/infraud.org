const fs = require('fs');
const path = require('path');

const dir = 'z:/frontend';

// The exact navbar code from index.html (with placeholder for active class)
const navTemplate = `  <!-- ═══════════════════════════════════════════
       PREMIUM EDGE-TO-EDGE NAV V3
  ════════════════════════════════════════════ -->
  <header class="nav-edge">
    <div class="container nav-edge-inner">
      
      <!-- Logo -->
      <a href="/" class="nav-edge-logo">
        <img src="assets/logo.jpg" alt="INFRAUD logo" />
        <span>INFRAUD</span>
      </a>

      <!-- Menu -->
      <nav class="nav-edge-menu">
        <a href="/" data-nav="index">Home</a>
        <a href="check.html" data-nav="check">Check</a>
        <a href="reports.html" data-nav="reports">Reports</a>
        <a href="blog.html" data-nav="blog">Blog</a>
        <a href="learn.html" data-nav="learn">Learn</a>
        <a href="about.html" data-nav="about">About</a>
      </nav>

      <!-- Actions -->
      <div class="nav-edge-actions">
        <a href="/#analyzer-section" class="nav-edge-signup" onclick="setTimeout(() => document.getElementById('hero-search-input')?.focus(), 100)">
          Get Started
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        
        <button class="nav-edge-hamburger" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

    </div>

    <style>
      .nav-edge {
        position: sticky; top: 0; z-index: 500; width: 100%; height: 72px;
        background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        border-bottom: 1px solid rgba(10, 15, 30, 0.08); transition: background 0.3s, box-shadow 0.3s;
      }
      .nav-edge.scrolled { background: rgba(255, 255, 255, 0.95); box-shadow: 0 4px 24px -8px rgba(10, 15, 30, 0.08); }
      .nav-edge-inner { display: flex; align-items: center; justify-content: space-between; height: 100%; position: relative; }
      
      /* Logo */
      .nav-edge-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; z-index: 2; }
      .nav-edge-logo img { width: 32px; height: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
      .nav-edge-logo:hover img { transform: scale(1.08) rotate(-3deg); }
      .nav-edge-logo span { font-weight: 800; font-size: 1.25rem; letter-spacing: -0.02em; color: var(--ink-900, #0A0F1E); }
      
      /* Menu (Centered on Desktop) */
      .nav-edge-menu { position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; }
      .nav-edge-menu a { position: relative; text-decoration: none; font-size: 0.9375rem; font-weight: 600; color: var(--ink-500, #4B5570); padding: 8px 16px; transition: color 0.2s; }
      .nav-edge-menu a:hover, .nav-edge-menu a.active { color: var(--ink-900, #0A0F1E); }
      .nav-edge-menu a::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%) scaleX(0); width: calc(100% - 32px); height: 2px; background: var(--blue-600, #2563EB); border-radius: 2px; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
      .nav-edge-menu a:hover::after, .nav-edge-menu a.active::after { transform: translateX(-50%) scaleX(1); }
      
      /* Actions */
      .nav-edge-actions { display: flex; align-items: center; gap: 16px; z-index: 2; }
      .nav-edge-login { text-decoration: none; font-size: 0.9375rem; font-weight: 600; color: var(--ink-700, #1E2742); padding: 8px; transition: color 0.2s; }
      .nav-edge-login:hover { color: var(--blue-600, #2563EB); }
      .nav-edge-signup { display: inline-flex; align-items: center; gap: 6px; background: var(--blue-600, #2563EB); color: #fff; text-decoration: none; font-size: 0.9375rem; font-weight: 700; padding: 10px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37,99,235,0.2); transition: all 0.2s; }
      .nav-edge-signup svg { width: 14px; height: 14px; transition: transform 0.2s; }
      .nav-edge-signup:hover { background: var(--blue-700, #1D4ED8); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.3); }
      .nav-edge-signup:hover svg { transform: translateX(2px); }
      
      /* Hamburger (Mobile) */
      .nav-edge-hamburger { display: none; background: none; border: none; cursor: pointer; color: var(--ink-900, #0A0F1E); padding: 4px; }
      
      @media (max-width: 900px) {
        .nav-edge-menu { display: none; }
        .nav-edge-actions .nav-edge-login, .nav-edge-actions .nav-edge-signup { display: none; }
        .nav-edge-hamburger { display: flex; align-items: center; justify-content: center; }
      }
    </style>
    <script>
      window.addEventListener('scroll', () => {
        const nav = document.querySelector('.nav-edge');
        if(nav) {
            if(window.scrollY > 20) {
              nav.classList.add('scrolled');
            } else {
              nav.classList.remove('scrolled');
            }
        }
      }, { passive: true });
    </script>
  </header>`;

const targetFiles = [
    'about.html',
    'check.html',
    'dashboard.html',
    'learn.html',
    'report.html',
    'reports.html',
    'result.html',
    'search.html',
    'tools.html',
    'blog.html',
    'index.html' // Just apply to index to be safe and consistent with active state setting logic
];

targetFiles.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Match existing <nav class="navbar"> ... </nav>
        const oldNavRegex1 = /<nav class="navbar">[\s\S]*?<\/nav>/;
        // Match existing <header class="nav-edge"> ... </header>
        const oldNavRegex2 = /<header class="nav-edge">[\s\S]*?<\/header>/;
        // Match <header class="nav-edge"> to </header> with <!-- PREMIUM EDGE-TO-EDGE NAV V3 -->
        const oldNavRegex3 = /<!-- ═══════════════════════════════════════════\s+PREMIUM EDGE-TO-EDGE NAV.*?\s+════════════════════════════════════════════ -->\s*<header class="nav-edge">[\s\S]*?<\/header>/;
        const oldNavRegex4 = /<!-- PREMIUM EDGE-TO-EDGE NAV -->\s*<header class="nav-edge">[\s\S]*?<\/header>/;
        
        let newContent = content;

        if (oldNavRegex3.test(newContent)) {
            newContent = newContent.replace(oldNavRegex3, navTemplate);
        } else if (oldNavRegex4.test(newContent)) {
             newContent = newContent.replace(oldNavRegex4, navTemplate);
        } else if (oldNavRegex2.test(newContent)) {
            newContent = newContent.replace(oldNavRegex2, navTemplate);
        } else if (oldNavRegex1.test(newContent)) {
            newContent = newContent.replace(oldNavRegex1, navTemplate);
        } else {
            console.log(`Could not find navbar in ${file}`);
            return;
        }

        // Set the active class
        const pageName = file.replace('.html', '');
        
        // Remove active class from all
        newContent = newContent.replace(/data-nav="([^"]+)" class="active"/g, 'data-nav="$1"');
        
        // Set active class for current page
        const activeRegex = new RegExp(`data-nav="${pageName}"`);
        newContent = newContent.replace(activeRegex, `data-nav="${pageName}" class="active"`);
        
        // Clean up data-nav attributes
        newContent = newContent.replace(/data-nav="[^"]+"/g, '');

        fs.writeFileSync(filePath, newContent);
        console.log(`Updated navbar in ${file}`);
    }
});
