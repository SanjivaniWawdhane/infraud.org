const fs = require('fs');

const htmlContent = fs.readFileSync('z:/frontend/index.html', 'utf8');
const lines = htmlContent.split('\n');

const scratchContent = fs.readFileSync('z:/frontend/scratch_cta.html', 'utf8');

// Find start and end
const start = lines.findIndex(l => l.includes('FINAL CTA — REDESIGNED') || l.includes('FINAL CTA — LIGHT THEME REDESIGNED')) - 1; // get the <!-- line
let end = lines.findIndex((l, i) => i > start && l.includes('</main>')) - 1; // get the line before </main>

console.log('Replacing from', start, 'to', end);

if (start !== -2 && end !== -2 && end > start) {
  lines.splice(start, end - start + 1, scratchContent);
  fs.writeFileSync('z:/frontend/index.html', lines.join('\n'), 'utf8');
  console.log('Replaced successfully');
} else {
  console.error('Could not find bounds', start, end);
}
