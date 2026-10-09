const fs = require('fs');
const path = require('path');

const dir = 'z:/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !f.startsWith('scratch_') && f !== 'index.html');

const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// Extract the CORRECT footer using regex
const correctFooterMatch = indexHtml.match(/<!-- ═══════════════════════════════════════════[\r\n\s]+V5 ULTRA PREMIUM FOOTER \(LIGHT THEME\)[\s\S]*?<\/footer>/);
if (!correctFooterMatch) {
  console.error("Could not find correct footer in index.html");
  process.exit(1);
}
const correctFooter = correctFooterMatch[0];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the rogue DOCTYPE that marks the start of the injected index.html
  const rogueIdx = content.indexOf('<!DOCTYPE html>', 10);
  if (rogueIdx !== -1) {
    // The rogue section starts at rogueIdx.
    // Where does it end? It ends where the injected index.html's footer ends.
    // The injected index.html contains everything up to `</footer>`.
    // Wait, since the injected content is exactly `index.html` up to `</footer>`, 
    // the NEXT `</footer>` after `rogueIdx` is the end of the injected block!
    const injectedEndIdx = content.indexOf('</footer>', rogueIdx);
    
    if (injectedEndIdx !== -1) {
      const beforeRogue = content.substring(0, rogueIdx);
      const afterRogue = content.substring(injectedEndIdx + 9);
      
      const fixedContent = beforeRogue + correctFooter + afterRogue;
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`Fixed ${file}`);
    } else {
      console.error(`Could not find </footer> after rogue block in ${file}`);
    }
  } else {
    console.log(`${file} is not corrupted`);
  }
}
console.log("Done");
