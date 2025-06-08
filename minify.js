// minify.js
const htmlnano = require('htmlnano');
const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '_site'); // Caminho para sua pasta _site

async function minifyHtmlFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Se for um diretório, recursivamente minifica os arquivos dentro dele
            await minifyHtmlFiles(filePath);
        } else if (file.endsWith('.html')) {
            // Se for um arquivo HTML, minifique-o
            try {
                const htmlContent = fs.readFileSync(filePath, 'utf8');
                const { html } = await htmlnano.process(htmlContent);
                fs.writeFileSync(filePath, html);
                console.log(`Minified: ${filePath}`);
            } catch (error) {
                console.error(`Error minifying ${filePath}:`, error);
            }
        }
    }
}

// Inicia o processo de minificação
minifyHtmlFiles(siteDir)
    .then(() => console.log('HTML minification complete.'))
    .catch(error => console.error('HTML minification failed:', error));