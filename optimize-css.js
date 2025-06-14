const fs = require('fs').promises;
const path = require('path');
const dropcss = require('dropcss'); // Importando como função
const { transform } = require('lightningcss');

const BUILD_DIR = '_site';
const CSS_PATH = path.join(BUILD_DIR, 'css', 'main.css');

function percent(orig, final) {
  return ((1 - final / orig) * 100).toFixed(2);
}

async function findHtmlFiles(dir) {
  let htmlFiles = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      htmlFiles = htmlFiles.concat(await findHtmlFiles(fullPath));
    } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.html') {
      htmlFiles.push(fullPath);
    }
  }
  return htmlFiles;
}

function cleanHtml(html) {
  let out = html.replace(/<\?xml[^>]*\?>/g, '');
  out = out.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  return out;
}

async function optimizeCss() {
  console.log('🚀 Iniciando otimização CSS...');

  let rawCss;
  try {
    rawCss = await fs.readFile(CSS_PATH, 'utf8');
  } catch {
    console.error('❌ CSS não encontrado:', CSS_PATH);
    process.exit(1);
  }
  const origSize = Buffer.byteLength(rawCss);
  console.log(`📦 CSS original: ${origSize} bytes`);

  let htmlFiles;
  try {
    htmlFiles = await findHtmlFiles(BUILD_DIR);
  } catch (err) {
    console.error('❌ Falha ao buscar HTMLs:', err);
    process.exit(1);
  }

  let combinedHtml = '';
  for (const file of htmlFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      combinedHtml += cleanHtml(content) + ' ';
    } catch (err) {
      console.warn(`⚠ Não leu HTML ${file}:`, err.message);
    }
  }

  let purgedCss;
  try {
    // CORREÇÃO AQUI: Chama dropcss como uma função, não um construtor com .purge()
    const result = await dropcss({ // <-- Chamada correta do dropcss
      html: combinedHtml,
      css: rawCss,
      onlyUsed: true,
      minify: false,
      removeHtml: false,
      removeUnusedKeyframes: true,
      removeUnusedFontFaces: true,
    });
    purgedCss = result.css;
  } catch (err) {
    console.error('🔥 DropCSS falhou:', err);
    process.exit(1);
  }

  const purgedSize = Buffer.byteLength(purgedCss);
  console.log(`🎯 Após DropCSS: ${purgedSize} bytes (${percent(origSize, purgedSize)}% redução)`);

  let finalCss;
  try {
    const { code } = transform({
      filename: 'main.css',
      code: Buffer.from(purgedCss, 'utf8'),
      minify: true,
      drafts: { nesting: true, customMedia: true },
      targets: {
        chrome: 110000,
        firefox: 110000,
        safari: 15000,
        edge: 110000,
        ios_saf: 15000,
        android: 110000,
      },
    });
    finalCss = code.toString('utf8');
  } catch (err) {
    console.error('🔥 LightningCSS falhou:', err);
    process.exit(1);
  }

  const finalSize = Buffer.byteLength(finalCss);
  console.log(`⚡ CSS final: ${finalSize} bytes (${percent(origSize, finalSize)}% total)`);

  await fs.writeFile(CSS_PATH, finalCss);
  console.log('✅ Otimização concluída!');
}

optimizeCss().catch(err => {
  console.error('🔥 Erro inesperado:', err);
  process.exit(1);
});