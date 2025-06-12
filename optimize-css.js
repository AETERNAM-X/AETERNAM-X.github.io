// optimize-css.js
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');

const buildDir = '_site';
const cssFiles = [];

function findCssFiles(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            findCssFiles(fullPath);
        } else if (dirent.isFile() && path.extname(fullPath) === '.css') {
            cssFiles.push(fullPath);
        }
    });
}

async function optimizeCss() {
    console.log('Starting CSS optimization with PostCSS and cssnano...');
    findCssFiles(buildDir);

    if (cssFiles.length === 0) {
        console.log('No CSS files found to optimize. Skipping CSS optimization.');
        return;
    }

    for (const filePath of cssFiles) {
        try {
            const css = fs.readFileSync(filePath, 'utf8');
            const result = await postcss([cssnano()]).process(css, { from: filePath, to: filePath });
            fs.writeFileSync(filePath, result.css);
            console.log(`Optimized: ${filePath}`);
        } catch (error) {
            console.error(`Error optimizing ${filePath}:`, error.message);
            process.exit(1);
        }
    }
    console.log('CSS optimization complete.');
}

optimizeCss().catch(console.error);