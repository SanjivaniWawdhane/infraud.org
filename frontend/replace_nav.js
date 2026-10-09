const fs = require('fs');

const htmlContent = fs.readFileSync('z:/frontend/index.html', 'utf8');
const lines = htmlContent.split('\n');

const scratchContent = fs.readFileSync('z:/frontend/scratch_nav_v3.html', 'utf8');

let navStart = lines.findIndex((l, i) => i > 300 && l.includes('<header class="premium-nav-wrapper">'));
let start = navStart > 3 ? navStart - 3 : navStart; // back up to the comment

let end = lines.findIndex((l, i) => i > navStart && l.includes('</header>'));

console.log('Replacing from index', start, 'to', end);

if (navStart !== -1 && end > start) {
  lines.splice(start, end - start + 1, scratchContent);
  fs.writeFileSync('z:/frontend/index.html', lines.join('\n'), 'utf8');
  console.log('Replaced successfully');
} else {
  console.error('Could not find bounds', start, end);
}
