const fs = require('fs');

const htmlContent = fs.readFileSync('z:/frontend/index.html', 'utf8');
const lines = htmlContent.split('\n');

const scratchContent = fs.readFileSync('z:/frontend/scratch_cta_v4.html', 'utf8');

let start = lines.findIndex(l => l.includes('FINAL CTA'));
if (start !== -1) {
  start -= 1; // back up to the comment line <!--
}

let end = lines.findIndex((l, i) => i > start && l.includes('</main>')) - 1; // up to the line before </main>

console.log('Replacing from index', start, 'to', end);

if (start > 0 && end > start) {
  lines.splice(start, end - start + 1, scratchContent);
  fs.writeFileSync('z:/frontend/index.html', lines.join('\n'), 'utf8');
  console.log('Replaced successfully');
} else {
  console.error('Could not find bounds', start, end);
}
