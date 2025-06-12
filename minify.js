// minify.js
const fs = require('fs').promises; // Usar promises para operações de arquivo assíncronas
const path = require('path');
const htmlnano = require('htmlnano'); // Certifique-se de que htmlnano está instalado

const buildDir = '_site'; // <-- ESTA LINHA É CRUCIAL PARA DEFINIR O DIRETÓRIO BASE

// Função para encontrar todos os arquivos HTML no diretório de build
async function findHtmlFiles(dir, fileList = []) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            await findHtmlFiles(fullPath, fileList); // Recursivamente
        } else if (dirent.isFile() && path.extname(fullPath) === '.html') {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

async function minifyHtmlFiles() {
    console.log('Starting HTML minification...');

    const files = await findHtmlFiles(buildDir); // Usa buildDir aqui

    if (files.length === 0) {
        console.log('No HTML files found to minify. Skipping HTML minification.');
        return;
    }

    for (const filePath of files) {
        try {
            const html = await fs.readFile(filePath, 'utf8');
            // Usando htmlnano para minificar o HTML
            const result = await htmlnano.process(html);
            await fs.writeFile(filePath, result.html);
            console.log(`Minified: ${filePath}`);
        } catch (error) {
            console.error(`Error minifying ${filePath}:`, error.message);
            process.exit(1);
        }
    }
    console.log('HTML minification complete.');
}

// Chama a função principal para iniciar a minificação
minifyHtmlFiles().catch(error => {
    console.error('An unhandled error occurred during HTML minification:', error);
    process.exit(1);
});