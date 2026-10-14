const fs = require('fs');

const htmlContent = fs.readFileSync('z:/frontend/index.html', 'utf8');
const lines = htmlContent.split('\n');

const scratchContent = fs.readFileSync('z:/frontend/scratch_footer_v5.html', 'utf8');

// The footer block starts at the comment right before <footer
let start = lines.findIndex(l => l.includes('PREMIUM FOOTER'));
if (start !== -1) {
  start -= 1; // get the <!-- line
} else {
  // Try finding just <footer
  start = lines.findIndex(l => l.includes('<footer')) - 1;
}

let end = lines.findIndex((l, i) => i > start && l.includes('</footer>'));

console.log('Replacing from index', start, 'to', end);

if (start > 0 && end > start) {
  lines.splice(start, end - start + 1, scratchContent);
  fs.writeFileSync('z:/frontend/index.html', lines.join('\n'), 'utf8');
  console.log('Replaced successfully');
} else {
  console.error('Could not find bounds', start, end);
}
