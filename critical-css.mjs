import * as critical from 'critical';
import path from 'path';
import { promises as fs } from 'fs';

const buildDir = '_site';

async function generateCriticalCss() {
    console.log('\nStarting Critical CSS generation...');

    const pagesToProcess = [
        {
            url: 'index.html',
            template: 'index'
        },
        {
            url: '2025/05/15/human-machine-learning/index.html',
            template: 'post'
        },
    ];

    for (const page of pagesToProcess) {
        try {
            const htmlPath = path.join(buildDir, page.url);
            let htmlContent = await fs.readFile(htmlPath, 'utf8');

            console.log(`Generating Critical CSS for: ${page.url}`);

            const { css, html } = await critical.generate({
                html: htmlContent,
                base: buildDir,
                css: [
                    path.join(buildDir, 'assets', 'css', 'style.css'),
                    path.join(buildDir, 'css', 'main.css')
                ],
                dimensions: [
                    { width: 320, height: 480 },
                    { width: 1280, height: 800 },
                ],
            });

            const updatedHtml = htmlContent.replace('</head>', `<style>${css}</style>\n</head>`);
            await fs.writeFile(htmlPath, updatedHtml);

            console.log(`Critical CSS generated and inlined for ${page.url}.`);

        } catch (error) {
            console.error(`Error generating Critical CSS for ${page.url}:`, error.message);
        }
    }
    console.log('Critical CSS generation complete.');
}

generateCriticalCss().catch(error => {
    console.error('An unhandled error occurred during Critical CSS generation:', error);
    process.exit(1);
});