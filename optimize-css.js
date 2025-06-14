const fs = require('fs').promises;
const path = require('path');
const { transform } = require('lightningcss');
const { PurgeCSS } = require('purgecss');

const buildDir = '_site';
const cssMainDir = path.join(buildDir, 'css');
const safelist = {
  standard: ['active', /^btn-/],
  deep: [/^dynamic-/],
  greedy: [/^js-/],
};

function percentReduction(orig, size) {
  return ((1 - size / orig) * 100).toFixed(2);
}

async function optimizeCssFiles() {
  console.log('Starting CSS optimization with PurgeCSS and Lightning CSS...');
  const filesToProcess = [];
  const mainCssPath = path.join(cssMainDir, 'main.css');

  try {
    await fs.access(mainCssPath);
    filesToProcess.push(mainCssPath);
  } catch {
    console.warn(`Warning: ${mainCssPath} not found. Skipping.`);
  }

  if (!filesToProcess.length) {
    console.log('No CSS files found to optimize. Skipping CSS optimization.');
    return;
  }

  const purgeCssContent = [`${buildDir}/**/*.html`];

  for (const filePath of filesToProcess) {
    try {
      const originalCssContent = await fs.readFile(filePath, 'utf8');
      const originalSize = Buffer.byteLength(originalCssContent, 'utf8');
      console.log(`\n--- Processing: ${filePath} ---`);
      console.log(`Original size: ${originalSize} bytes`);

      const purgeResult = await new PurgeCSS().purge({
        content: purgeCssContent,
        css: [{ raw: originalCssContent }],
        safelist,
        keyframes: true,
        fontFace: true,
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      });

      const purgedCssContent = purgeResult[0].css;
      const purgedSize = Buffer.byteLength(purgedCssContent, 'utf8');
      console.log(`Size after PurgeCSS: ${purgedSize} bytes (${percentReduction(originalSize, purgedSize)}% reduction)`);

      const { code } = transform({
        filename: path.basename(filePath),
        code: Buffer.from(purgedCssContent),
        minify: true,
        sourceMap: false,
        targets: {
          chrome: 110000,
          firefox: 110000,
          safari: 15000,
          edge: 110000,
          ios_saf: 15000,
          android: 110000,
        },
        drafts: {
          nesting: true,
          customMedia: true,
        }
      });

      const finalCssCode = code.toString('utf8');
      const finalSize = Buffer.byteLength(finalCssCode, 'utf8');
      console.log(`Size after Lightning CSS (final): ${finalSize} bytes (${percentReduction(originalSize, finalSize)}% total reduction)`);

      await fs.writeFile(filePath, finalCssCode);
      console.log(`Optimized: ${filePath}`);
    } catch (e) {
      console.error(`Error optimizing ${filePath}:`, e.message);
      process.exit(1);
    }
  }
  console.log('\nCSS optimization complete.');
}

optimizeCssFiles().catch(e => {
  console.error('Unhandled error during CSS optimization:', e);
  process.exit(1);
});
