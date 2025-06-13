import Critters from 'critters';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const buildDir = '_site';
const projectRoot = process.cwd();

async function generateCriticalCss() {
    console.log('\nStarting Critical CSS generation with Critters...');

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

    const globalCssFile = path.join(projectRoot, buildDir, 'assets', 'css', 'style.css');
    const mainCssFile = path.join(projectRoot, buildDir, 'css', 'main.css');

    const critters = new Critters({
        external: false,
        inlineThreshold: 0,
        path: buildDir,
        puppeteer: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        }
    });

    for (const page of pagesToProcess) {
        const htmlPath = path.join(buildDir, page.url);

        try {
            console.log(`Generating Critical CSS for: ${page.url}`);

            let htmlContent = await readFile(htmlPath, 'utf8');

            const cssContent = [
                await readFile(globalCssFile, 'utf8'),
                await readFile(mainCssFile, 'utf8')
            ].join('\n');

            const inlinedHtml = await critters.process(htmlContent);

            await writeFile(htmlPath, inlinedHtml);

            console.log(`Critical CSS generated and inlined for ${page.url}.`);

        } catch (error) {
            console.error(`Error generating Critical CSS for ${page.url}:`, error.message);
        }
    }
    console.log('Critters Critical CSS generation complete.');
}

generateCriticalCss().catch(error => {
    console.error('An unhandled error occurred during Critters Critical CSS generation:', error);
    process.exit(1);
});