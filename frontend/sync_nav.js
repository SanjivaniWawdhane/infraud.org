const fs = require('fs');
const path = require('path');

const dir = 'z:/frontend';

// Read index.html to get the latest navbar
const indexHtmlPath = path.join(dir, 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Regex to capture the entire <header class="nav-edge"> block, including its <style> and <script>
// We use a non-greedy match to get everything up to </header>
const navMatch = indexHtmlContent.match(/<header class="nav-edge">[\s\S]*?<\/header>/);

if (!navMatch) {
    console.error("Could not find <header class=\"nav-edge\"> in index.html");
    process.exit(1);
}

const latestNavbar = navMatch[0];

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
    'blog.html'
];

targetFiles.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Regexes to match the old navbars in the target files
        const oldNavRegex1 = /<nav class="navbar">[\s\S]*?<\/nav>/;
        const oldNavRegex2 = /<!-- ═══════════════════════════════════════════\s*PREMIUM EDGE-TO-EDGE NAV.*?\s*════════════════════════════════════════════ -->\s*<header class="nav-edge">[\s\S]*?<\/header>/;
        const oldNavRegex3 = /<!-- PREMIUM EDGE-TO-EDGE NAV -->\s*<header class="nav-edge">[\s\S]*?<\/header>/;
        const oldNavRegex4 = /<header class="nav-edge">[\s\S]*?<\/header>/;
        
        let newContent = content;

        if (oldNavRegex2.test(newContent)) {
            newContent = newContent.replace(oldNavRegex2, latestNavbar);
        } else if (oldNavRegex3.test(newContent)) {
            newContent = newContent.replace(oldNavRegex3, latestNavbar);
        } else if (oldNavRegex4.test(newContent)) {
            newContent = newContent.replace(oldNavRegex4, latestNavbar);
        } else if (oldNavRegex1.test(newContent)) {
            newContent = newContent.replace(oldNavRegex1, latestNavbar);
        } else {
            console.log(`Could not find a navbar to replace in ${file}`);
            return;
        }

        // Now we need to set the 'active' class correctly for this page.
        // Remove 'active' from all links in the navbar
        const pageName = file.replace('.html', '');
        
        // Remove class="active" and active class from any href links inside the newly pasted navbar
        // Since we copied from index.html, the Home link might have 'class="active"'.
        
        // Regex to match a tags inside the menu
        newContent = newContent.replace(/<nav class="nav-edge-menu">([\s\S]*?)<\/nav>/, (match, menuContent) => {
            // Remove 'active' class from all links
            let updatedMenu = menuContent.replace(/class="[^"]*active[^"]*"/g, '');
            updatedMenu = updatedMenu.replace(/\s*class=""/g, ''); // cleanup empty classes
            
            // Add 'active' class to the correct link based on the current file
            // E.g., for about.html, find <a href="about.html"> and make it <a href="about.html" class="active">
            // For blog.html, find <a href="blog.html">
            const hrefRegex = new RegExp(`(<a href="${file}"|<a href="/?${file}")`);
            
            if (hrefRegex.test(updatedMenu)) {
                updatedMenu = updatedMenu.replace(hrefRegex, '$1 class="active"');
            }
            
            return `<nav class="nav-edge-menu">${updatedMenu}</nav>`;
        });

        fs.writeFileSync(filePath, newContent);
        console.log(`Dynamically synced navbar to ${file}`);
    }
});
