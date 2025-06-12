// compress-brotli.js
const fs = require('fs').promises; // Usar promises para operações de arquivo assíncronas
const path = require('path');
const brotli = require('brotli-compress'); // Importa a biblioteca brotli-compress

const buildDir = '_site'; // Diretório de saída do Jekyll
const extensionsToCompress = ['.html', '.css', '.js', '.svg', '.xml', '.txt', '.json'];

// Função para encontrar todos os arquivos no diretório de build
async function findFiles(dir, fileList = []) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            await findFiles(fullPath, fileList); // Recursivamente
        } else if (dirent.isFile() && extensionsToCompress.includes(path.extname(fullPath))) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

async function compressFiles() {
    console.log('Starting Brotli compression with brotli-compress (Node.js library)...');

    const files = await findFiles(buildDir);

    if (files.length === 0) {
        console.log('No compressible files found. Skipping Brotli compression.');
        return;
    }

    for (const filePath of files) {
        try {
            const inputBuffer = await fs.readFile(filePath);
            // Comprime o buffer usando a biblioteca brotli-compress
            // A qualidade (quality) pode ser ajustada de 0 a 11 (11 é o padrão e máximo)
            const compressedBuffer = await brotli.compress(inputBuffer, { quality: 11 });
            
            const outputPath = `${filePath}.br`;
            await fs.writeFile(outputPath, compressedBuffer);
            console.log(`Compressed: ${outputPath}`);
        } catch (error) {
            console.error(`Error compressing ${filePath}:`, error.message);
            // Faz o build falhar se a compressão falhar
            process.exit(1);
        }
    }
    console.log('Brotli compression complete.');
}

compressFiles().catch(error => {
    console.error('An unhandled error occurred during Brotli compression:', error);
    process.exit(1);
});