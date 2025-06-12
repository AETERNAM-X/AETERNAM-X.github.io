// compress-brotli.js
const fs = require('fs').promises;
const path = require('path');
const brotli = require('brotli-compress');

const buildDir = '_site';
// Tipos de arquivo que serão comprimidos e DOS QUAIS AS VERSÕES ORIGINAIS SERÃO DELETADAS
const extensionsToCompressAndRemoveOriginal = ['.html', '.css', '.js', '.svg', '.xml', '.txt', '.json'];

async function findFiles(dir, fileList = []) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            await findFiles(fullPath, fileList);
        } else if (dirent.isFile() && extensionsToCompressAndRemoveOriginal.includes(path.extname(fullPath))) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

async function compressAndCleanFiles() {
    console.log('Starting Brotli compression and then deleting original files...');

    const filesToProcess = await findFiles(buildDir);

    if (filesToProcess.length === 0) {
        console.log('No compressible files found. Skipping Brotli compression and cleanup.');
        return;
    }

    const originalFilesToDelete = [];

    for (const filePath of filesToProcess) {
        try {
            const inputBuffer = await fs.readFile(filePath);
            const compressedBuffer = await brotli.compress(inputBuffer, { quality: 11 }); // Mantendo qualidade 11 para o teste

            const outputPath = `${filePath}.br`;
            await fs.writeFile(outputPath, compressedBuffer);
            console.log(`Compressed: ${outputPath}`);

            // Adiciona o arquivo original para exclusão após a compressão
            originalFilesToDelete.push(filePath);

        } catch (error) {
            console.error(`Error compressing ${filePath}:`, error.message);
            // Decide se você quer continuar ou parar o processo
            // process.exit(1);
        }
    }

    console.log('Brotli compression complete. Starting original file cleanup...');

    for (const originalPath of originalFilesToDelete) {
        try {
            await fs.unlink(originalPath); // Deleta o arquivo original
            console.log(`Deleted original: ${originalPath}`);
        } catch (error) {
            console.error(`Error deleting original file ${originalPath}:`, error.message);
            // Decide se você quer continuar ou parar o processo
            // process.exit(1);
        }
    }

    console.log('Original file cleanup complete.');
    console.log('Brotli compression and original file deletion process finished.');
}

// Chama a função principal
compressAndCleanFiles().catch(error => {
    console.error('An unhandled error occurred during Brotli compression and cleanup:', error);
    process.exit(1);
});