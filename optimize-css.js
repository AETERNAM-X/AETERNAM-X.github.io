const fs = require('fs').promises;
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
const { transform } = require('lightningcss');
const { PurgeCSS } = require('purgecss');

const buildDir = '_site';
const cssSourceDir = path.join(buildDir, 'assets', 'css');
const cssMainDir = path.join(buildDir, 'css');

async function optimizeCssFiles() {
    console.log('Starting CSS optimization with PurgeCSS, PostCSS/cssnano, then lightningcss...');

    const filesToProcess = [];

    const styleCssPath = path.join(cssSourceDir, 'style.css');
    const mainCssPath = path.join(cssMainDir, 'main.css');

    try {
        await fs.access(styleCssPath);
        filesToProcess.push(styleCssPath);
    } catch (e) {
        console.warn(`Warning: ${styleCssPath} not found. Skipping.`);
    }

    try {
        await fs.access(mainCssPath);
        filesToProcess.push(mainCssPath);
    } catch (e) {
        console.warn(`Warning: ${mainCssPath} not found. Skipping.`);
    }

    if (filesToProcess.length === 0) {
        console.log('No CSS files found to optimize. Skipping CSS optimization.');
        return;
    }

    const purgeCssContent = [
        `${buildDir}/**/*.html`,
    ];

    for (const filePath of filesToProcess) {
        try {
            const originalCssContent = await fs.readFile(filePath, 'utf8');
            const originalSize = Buffer.byteLength(originalCssContent, 'utf8');
            console.log(`\n--- Processing: ${filePath} ---`);
            console.log(`Original size: ${originalSize} bytes`);

            const purgeCssResult = await new PurgeCSS().purge({
                content: purgeCssContent,
                css: [{ raw: originalCssContent }],
            });

            const purgedCssContent = purgeCssResult[0].css;
            const purgedSize = Buffer.byteLength(purgedCssContent, 'utf8');
            console.log(`Size after PurgeCSS: ${purgedSize} bytes (${((1 - purgedSize / originalSize) * 100).toFixed(2)}% reduction)`);

            const postCssResult = await postcss([
                cssnano({
                    preset: ['default', {
                        discardComments: {
                            removeAll: true,
                        },
                    }],
                })
            ]).process(purgedCssContent, { from: filePath, to: filePath });

            const postCssSize = Buffer.byteLength(postCssResult.css, 'utf8');
            console.log(`Size after cssnano: ${postCssSize} bytes (${((1 - postCssSize / originalSize) * 100).toFixed(2)}% total reduction)`);

            const { code: finalCssCode } = transform({
                filename: filePath,
                code: Buffer.from(postCssResult.css),
                minify: true,
                targets: {
                    android: 99 << 16,
                    chrome: 99 << 16,
                    edge: 99 << 16,
                    firefox: 99 << 16,
                    ios_saf: 15 << 16 | 4 << 8,
                    safari: 15 << 16 | 4 << 8,
                },
            });

            const finalSize = Buffer.byteLength(finalCssCode, 'utf8');
            console.log(`Size after lightningcss: ${finalSize} bytes (${((1 - finalSize / originalSize) * 100).toFixed(2)}% total reduction)`);

            await fs.writeFile(filePath, finalCssCode.toString());
            console.log(`Optimized: ${filePath}`);

        } catch (error) {
            console.error(`Error optimizing ${filePath}:`, error.message);
            process.exit(1);
        }
    }
    console.log('\nCSS optimization complete.');
}

optimizeCssFiles().catch(error => {
    console.error('An unhandled error occurred during CSS optimization:', error);
    process.exit(1);
});