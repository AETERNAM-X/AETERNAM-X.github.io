// compress-brotli.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = '_site';
const fileTypes = ['.html', '.css', '.js', '.xml', '.json', '.svg'];

// Função para encontrar o caminho do executável brotli
function findBrotliExecutable() {
  // 1. Tenta usar o comando 'brotli' que está no PATH (funciona no Linux/Cloudflare Pages e se brotli.exe estiver no PATH no Windows)
  try {
    execSync('brotli --version', { stdio: 'pipe' }); // Tenta executar para ver se está no PATH
    return 'brotli';
  } catch (error) {
    // Comando não encontrado no PATH
  }

  // 2. Se no Windows, tenta encontrar brotli.exe na pasta 'brotli' diretamente na raiz do projeto (onde você pode ter baixado)
  if (process.platform === 'win32') {
    const localBrotliExePath = path.join(__dirname, 'brotli', 'brotli.exe');
    if (fs.existsSync(localBrotliExePath)) {
      return localBrotliExePath;
    }
  }

  // 3. Se nenhuma das opções acima funcionou, verifica se o pacote `brotli` do npm criou um executável shim.
  //    No entanto, o pacote `brotli` (o oficial do Node.js) não é um CLI, então isso é improvável.
  //    Esta parte pode ser removida se tivermos certeza que `brotli` não é CLI.
  //    Se por algum motivo você tiver um pacote npm que instala um CLI chamado 'brotli', ele estaria aqui.
  if (process.platform === 'win32') {
    const npmBrotliCmd = path.join(__dirname, 'node_modules', '.bin', 'brotli.cmd');
    if (fs.existsSync(npmBrotliCmd)) {
      return npmBrotliCmd;
    }
  } else {
    const npmBrotliCmd = path.join(__dirname, 'node_modules', '.bin', 'brotli');
    if (fs.existsSync(npmBrotliCmd)) {
      return npmBrotliCmd;
    }
  }


  // Se não encontrar em nenhum lugar
  return null;
}

const brotliExecutable = findBrotliExecutable();

if (!brotliExecutable) {
  console.error('Error: Brotli executable not found.');
  console.error('Please ensure brotli is installed and accessible in your system PATH,');
  console.error('or place `brotli.exe` in a `brotli` folder in your project root,');
  console.error('or ensure a compatible npm package is in devDependencies and creates a CLI.');
  process.exit(1);
}

function compressDirectory(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      compressDirectory(fullPath); // Recursivamente comprime subdiretórios
    } else if (dirent.isFile() && fileTypes.includes(path.extname(fullPath))) {
      const brotliOutputPath = `${fullPath}.br`;
      try {
        console.log(`Compressing: ${fullPath} to ${brotliOutputPath}`);
        // Use aspas duplas ao redor do caminho do executável para lidar com espaços
        execSync(`"${brotliExecutable}" --force -q 11 -o "${brotliOutputPath}" "${fullPath}"`, { stdio: 'inherit' });
      } catch (error) {
        console.error(`Failed to compress ${fullPath}: ${error.message}`);
        // Se quiser que o build falhe se a compressão falhar, remova o comentário da linha abaixo:
        // throw error;
      }
    }
  });
}

console.log('Starting Brotli compression...');
try {
  compressDirectory(buildDir);
  console.log('Brotli compression complete.');
} catch (error) {
  console.error('Brotli compression failed:', error.message);
  process.exit(1); // Garante que o processo Node.js saia com erro se a compressão falhar
}