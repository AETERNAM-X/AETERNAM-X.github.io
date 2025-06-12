// compress-brotli.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = '_site'; // Diretório de saída do Jekyll
const extensionsToCompress = ['.html', '.css', '.js', '.svg', '.xml', '.txt', '.json'];

// Caminho para o executável brotli via npx (garantindo que brotli-cli está disponível)
const brotliCommand = 'npx brotli'; // npx garante que o binário do pacote seja usado

// Função para encontrar todos os arquivos no diretório de build
function findFiles(dir, fileList = []) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            findFiles(fullPath, fileList);
        } else if (dirent.isFile() && extensionsToCompress.includes(path.extname(fullPath))) {
            fileList.push(fullPath);
        }
    });
    return fileList;
}

async function compressFiles() {
    console.log('Starting Brotli compression using brotli-cli...');

    const files = findFiles(buildDir);

    if (files.length === 0) {
        console.log('No compressible files found. Skipping Brotli compression.');
        return;
    }

    for (const filePath of files) {
        try {
            // Comando para comprimir o arquivo
            // -f: force (sobrescreve se o .br já existir)
            // -k: keep (mantém o arquivo original)
            // -q 11: quality (qualidade máxima de compressão)
            // -o: output (especifica o arquivo de saída, que será com .br)
            const command = `${brotliCommand} -f -k -q 11 "${filePath}" -o "${filePath}.br"`;
            console.log(`Executing: ${command}`);
            execSync(command, { stdio: 'inherit' }); // 'inherit' para mostrar saída/erro do brotli
            console.log(`Compressed: ${filePath}.br`);
        } catch (error) {
            console.error(`Error compressing ${filePath}:`, error.message);
            // Continua com outros arquivos mesmo se um falhar, mas loga o erro.
            // Para que o build falhe se a compressão falhar, descomente a linha abaixo:
            // process.exit(1);
        }
    }
    console.log('Brotli compression complete.');
}

compressFiles().catch(console.error);