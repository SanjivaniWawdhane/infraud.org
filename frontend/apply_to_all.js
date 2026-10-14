const fs = require('fs');
const path = require('path');

const dir = 'z:/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !f.startsWith('scratch_') && f !== 'index.html');

const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// Extract new nav from index.html
const navStartStr = '<!-- ═══════════════════════════════════════════\r\n       PREMIUM EDGE-TO-EDGE NAV V3';
const navStartIndex = indexHtml.indexOf(navStartStr);
const navEndIndex = indexHtml.indexOf('</header>', navStartIndex);
let newNav = indexHtml.substring(navStartIndex, navEndIndex + 9);

// Fallback for LF line endings
if (navStartIndex === -1) {
  const lfNavStartStr = '<!-- ═══════════════════════════════════════════\n       PREMIUM EDGE-TO-EDGE NAV V3';
  const lfNavStartIdx = indexHtml.indexOf(lfNavStartStr);
  const lfNavEndIdx = indexHtml.indexOf('</header>', lfNavStartIdx);
  newNav = indexHtml.substring(lfNavStartIdx, lfNavEndIdx + 9);
}


// Extract new footer from index.html
const footerStartStr = '<!-- ═══════════════════════════════════════════\r\n       V5 ULTRA PREMIUM FOOTER (LIGHT THEME)';
const footerStartIndex = indexHtml.indexOf(footerStartStr);
const footerEndIndex = indexHtml.indexOf('</footer>', footerStartIndex);
let newFooter = indexHtml.substring(footerStartIndex, footerEndIndex + 9);

if (footerStartIndex === -1) {
  const lfFooterStartStr = '<!-- ═══════════════════════════════════════════\n       V5 ULTRA PREMIUM FOOTER (LIGHT THEME)';
  const lfFooterStartIdx = indexHtml.indexOf(lfFooterStartStr);
  const lfFooterEndIdx = indexHtml.indexOf('</footer>', lfFooterStartIdx);
  newFooter = indexHtml.substring(lfFooterStartIdx, lfFooterEndIdx + 9);
}

if (!newNav || !newFooter) {
  console.error("Could not extract nav or footer from index.html");
  process.exit(1);
}

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace Nav
  // The nav might have a comment block before it. We'll look for <header class="nav" or similar
  const oldNavMatch = content.match(/<!-- ═══════════════════════════════════════════[\r\n\s]+NAV[\r\n\s]+════════════════════════════════════════════ -->[\r\n\s]*<header class="nav[^>]*>[\s\S]*?<\/header>/);
  if (oldNavMatch) {
    content = content.replace(oldNavMatch[0], newNav);
    changed = true;
  } else {
    // try just the header
    const simpleNavMatch = content.match(/<header class="nav[^>]*>[\s\S]*?<\/header>/);
    if (simpleNavMatch) {
      content = content.replace(simpleNavMatch[0], newNav);
      changed = true;
    }
  }

  // Replace Footer
  const oldFooterMatch = content.match(/<!-- ═══════════════════════════════════════════[\r\n\s]+FOOTER[\s\S]*?<\/footer>/);
  if (oldFooterMatch) {
    content = content.replace(oldFooterMatch[0], newFooter);
    changed = true;
  } else {
    // try just the footer
    const simpleFooterMatch = content.match(/<footer class="[^>]*>[\s\S]*?<\/footer>/);
    if (simpleFooterMatch) {
      content = content.replace(simpleFooterMatch[0], newFooter);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

console.log("Done");
