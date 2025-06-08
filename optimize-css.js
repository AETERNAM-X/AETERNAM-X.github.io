// optimize-css.js
const { transform } = require('lightningcss');
const path = require('path');
const fs = require('fs');

// Lista de arquivos CSS que você quer otimizar com Lightning CSS
const cssFilesToOptimize = [
    path.join(__dirname, '_site', 'css', 'main.css'),
    path.join(__dirname, '_site', 'assets', 'css', 'style.css')
];

cssFilesToOptimize.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        const originalCss = fs.readFileSync(filePath, 'utf8');

        try {
            const { code } = transform({
                filename: filePath,
                code: Buffer.from(originalCss),
                minify: true, // Ativa a minificação
                // browsers: ['last 2 versions', '> 1%'],
            });
            fs.writeFileSync(filePath, code);
            console.log(`Lightning CSS optimized: ${filePath}`);
        } catch (e) {
            console.error(`Error optimizing ${filePath} with Lightning CSS:`, e);
        }
    } else {
        console.warn(`CSS file not found, skipping optimization: ${filePath}`);
    }
});