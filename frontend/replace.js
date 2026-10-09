const fs = require('fs');

const htmlContent = fs.readFileSync('z:/frontend/index.html', 'utf8');
const lines = htmlContent.split('\n');

const scratchContent = fs.readFileSync('z:/frontend/scratch_ecosystem.html', 'utf8');

// The start and end were dynamically found
const start = lines.findIndex(l => l.includes('THE INFRAUD ECOSYSTEM'));
let end = lines.findIndex((l, i) => i > start && l.includes('</section>'));

console.log('Replacing from', start, 'to', end);

if (start !== -1 && end !== -1) {
  lines.splice(start, end - start + 1, scratchContent);
  fs.writeFileSync('z:/frontend/index.html', lines.join('\n'), 'utf8');
  console.log('Replaced successfully');
} else {
  console.error('Could not find bounds');
}
