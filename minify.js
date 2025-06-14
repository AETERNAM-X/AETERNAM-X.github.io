const fs = require('fs').promises;
const path = require('path');
const htmlnano = require('htmlnano');

const buildDir = '_site';

async function findHtmlFiles(dir, files = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findHtmlFiles(fullPath, files);
    } else if (entry.isFile() && path.extname(fullPath) === '.html') {
      files.push(fullPath);
    }
  }
  return files;
}

async function minifyHtmlFiles() {
  const files = await findHtmlFiles(buildDir);
  if (!files.length) return;

  const options = {
    collapseWhitespace: 'conservative',
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeOptionalTags: true,
    removeAttributeQuotes: true,
    minifyCss: true,
    minifyJs: true,
    sortAttributes: true
  };

  for (const file of files) {
    try {
      let html = await fs.readFile(file, 'utf8');
      const originalSize = Buffer.byteLength(html, 'utf8');
      html = html.replace(/<script(?![^>]*\b(?:async|defer))(?=[^>]*\bsrc="[^"]+")/g, '<script defer');
      const { html: minified } = await htmlnano.process(html, options);
      const minifiedSize = Buffer.byteLength(minified, 'utf8');
      const percent = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
      await fs.writeFile(file, minified);
      console.log(`${file} — ${originalSize} → ${minifiedSize} bytes (-${percent}%)`);
    } catch (err) {
      console.error(`Error in ${file}: ${err.message}`);
      process.exit(1);
    }
  }
}

minifyHtmlFiles().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
