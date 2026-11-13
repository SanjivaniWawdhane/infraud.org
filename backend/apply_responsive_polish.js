const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '..', 'frontend'),
  path.join(__dirname, '..'),
  path.join(__dirname, '..', 'backend', 'public')
];

const htmlFiles = [
  'index.html', 'check.html', 'result.html', 'reports.html', 'report.html',
  'tools.html', 'about.html', 'learn.html', 'blog.html', 'blog_post.html',
  'search.html', 'login.html', 'signup.html', 'forgot-password.html',
  'reset-password.html', 'dashboard.html', 'admin_dashboard.html'
];

htmlFiles.forEach(file => {
  const srcPath = path.join(dirs[0], file);
  if (!fs.existsSync(srcPath)) return;
  let content = fs.readFileSync(srcPath, 'utf8');

  // 1. Fix footer-huge-mark font-size clamp across all files
  if (content.includes('clamp(4rem, 14vw, 15rem)')) {
    content = content.replace(/clamp\(4rem,\s*14vw,\s*15rem\)/g, 'clamp(2rem, 12vw, 15rem)');
  }

  // 2. Fix specific about.html padding and grid gap
  if (file === 'about.html') {
    content = content.replace(
      'style="padding-top: 120px; padding-bottom: 60px; border-bottom: 1px solid var(--ink-100);"',
      'class="section about-hero-section" style="border-bottom: 1px solid var(--ink-100);"'
    );
    if (!content.includes('.about-hero-section')) {
      content = content.replace(
        '.about-header {',
        '.about-header, .about-hero-section {'
      );
    }
  }

  // 3. Ensure responsive.css is linked in head
  if (!content.includes('css/responsive.css')) {
    content = content.replace('</head>', '  <link rel="stylesheet" href="css/responsive.css" />\n</head>');
  }

  // 4. Write back to frontend/
  fs.writeFileSync(srcPath, content, 'utf8');

  // 5. Sync to root and backend/public
  fs.writeFileSync(path.join(dirs[1], file), content, 'utf8');
  fs.writeFileSync(path.join(dirs[2], file), content, 'utf8');
  console.log(`Updated and synced ${file} across 3 directories.`);
});

console.log('All HTML files polished and synced successfully!');
