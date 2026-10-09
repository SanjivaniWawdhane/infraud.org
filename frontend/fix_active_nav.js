const fs = require('fs');
const path = require('path');

const dir = 'z:/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !f.startsWith('scratch_'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // First, remove class="active" from ALL nav links
  // The nav menu looks like:
  // <nav class="nav-edge-menu">
  //   <a href="/" class="active">Home</a>
  //   <a href="check.html">Check</a>
  
  // Find the nav menu block
  const menuMatch = content.match(/<nav class="nav-edge-menu">([\s\S]*?)<\/nav>/);
  if (menuMatch) {
    let menuHtml = menuMatch[1];
    
    // Remove all active classes
    menuHtml = menuHtml.replace(/ class="active"/g, '');
    
    // Now add active class to the correct link based on filename
    if (file === 'index.html') {
      menuHtml = menuHtml.replace(/href="\/"/, 'href="/" class="active"');
    } else if (file === 'check.html') {
      menuHtml = menuHtml.replace(/href="check\.html"/, 'href="check.html" class="active"');
    } else if (file === 'reports.html') {
      menuHtml = menuHtml.replace(/href="reports\.html"/, 'href="reports.html" class="active"');
    } else if (file === 'learn.html') {
      menuHtml = menuHtml.replace(/href="learn\.html"/, 'href="learn.html" class="active"');
    } else if (file === 'about.html') {
      menuHtml = menuHtml.replace(/href="about\.html"/, 'href="about.html" class="active"');
    }
    
    const newMenuMatch = `<nav class="nav-edge-menu">${menuHtml}</nav>`;
    content = content.replace(menuMatch[0], newMenuMatch);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed active state in ${file}`);
  }
}

console.log("Done");
