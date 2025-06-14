const fs = require('fs').promises;
const path = require('path');
const { transform } = require('lightningcss');
const { PurgeCSS } = require('purgecss');

const dir = '_site';
const cssPath = path.join(dir, 'css', 'main.css');
const content = [`${dir}/**/*.html`];
const safelist = {
  standard: ['active', /^btn-/],
  deep: [/^dynamic-/],
  greedy: [/^js-/],
};

const pct = (a, b) => ((1 - b / a) * 100).toFixed(2);

const run = async () => {
  try {
    await fs.access(cssPath);
  } catch {
    return;
  }

  let css;
  try {
    css = await fs.readFile(cssPath, 'utf8');
  } catch {
    return;
  }

  const orig = Buffer.byteLength(css);

  let purged;
  try {
    const out = await new PurgeCSS().purge({
      content,
      css: [{ raw: css }],
      safelist,
      keyframes: true,
      fontFace: true,
      defaultExtractor: c => c.match(/[\w-/:]+(?<!:)/g) || [],
    });
    purged = out[0].css;
  } catch {
    process.exit(1);
  }

  const mid = Buffer.byteLength(purged);

  let final;
  try {
    final = transform({
      filename: 'main.css',
      code: Buffer.from(purged),
      minify: true,
      sourceMap: false,
      analyzeDependencies: false,
      cssModules: false,
      drafts: { nesting: true, customMedia: true },
      targets: {
        chrome: 120000,
        firefox: 120000,
        safari: 170000,
        edge: 120000,
        ios_saf: 170000,
        android: 120000,
      },
    }).code.toString();
  } catch {
    process.exit(1);
  }

  const size = Buffer.byteLength(final);
  console.log(`Original: ${orig}b | Purged: ${mid}b (${pct(orig, mid)}%) | Final: ${size}b (${pct(orig, size)}%)`);
  await fs.writeFile(cssPath, final);
};

run().catch(() => process.exit(1));
