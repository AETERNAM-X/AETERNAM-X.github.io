const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');

const BASE_DIR = '_site';
const EXTENSIONS = new Set(['.html', '.htm', '.css', '.js', '.json', '.svg', '.xml']);

async function findFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      files = files.concat(await findFiles(fullPath));
    } else {
      if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function compressBrotli(filePath) {
  const data = await fs.readFile(filePath);
  const compressed = await new Promise((resolve, reject) => {
    zlib.brotliCompress(data, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11
      }
    }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
  await fs.writeFile(filePath + '.br', compressed);
  console.log(`Compressed Brotli: ${filePath}`);
}

(async () => {
  try {
    const files = await findFiles(BASE_DIR);
    for (const file of files) {
      if (file.endsWith('.br')) continue; // evita recomprimir
      await compressBrotli(file);
    }
    console.log('Brotli compression complete.');
  } catch (err) {
    console.error('Compression error:', err);
    process.exit(1);
  }
})();
