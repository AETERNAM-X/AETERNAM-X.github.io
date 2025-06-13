// generate-critical.mjs
// Mude a importação de 'critters' para 'beasties'
import Beasties from 'beasties';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const buildDir = '_site';
const projectRoot = process.cwd();

async function generateCriticalCssWithBeasties() { // Mude o nome da função para refletir o Beasties
    console.log('\nStarting Critical CSS generation with "Beasties" package...');

    const pagesToProcess = [
        { name: 'index.html', url: 'index.html' },
        { name: 'human-machine-learning', url: '2025/05/15/human-machine-learning/index.html' },
        { name: 'article-test', url: '2025/06/07/article-test/index.html' },
    ];

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';

    const beasties = new Beasties({ // Mude Critters para Beasties aqui
        path: buildDir,
        inlineThreshold: 2000,
        browser: {
            path: executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        },
    });

    for (const page of pagesToProcess) {
        const htmlPath = path.join(buildDir, page.url);
        try {
            console.log(`\nProcessing HTML for: ${page.url}`);

            const htmlContentBefore = await readFile(htmlPath, 'utf8');
            const htmlSizeBeforeKb = (Buffer.byteLength(htmlContentBefore, 'utf8') / 1024).toFixed(2);

            const newHtml = await beasties.process(htmlContentBefore); // Mude critters.process para beasties.process

            await writeFile(htmlPath, newHtml);

            const htmlSizeAfterKb = (Buffer.byteLength(newHtml, 'utf8') / 1024).toFixed(2);

            console.log(`  HTML size before "Beasties": ${htmlSizeBeforeKb} KB`);
            console.log(`  HTML size after "Beasties" : ${htmlSizeAfterKb} KB`);
            console.log(`  Difference                 : ${(htmlSizeAfterKb - htmlSizeBeforeKb).toFixed(2)} KB (inlined Critical CSS size)`);
            console.log(`Critical CSS generated and inlined for ${page.url}.`);

        } catch (error) {
            console.error(`Error generating Critical CSS for ${page.url}:`, error.message);
            console.error(error);
        }
    }
    console.log('\n"Beasties" Critical CSS generation complete.');
}

generateCriticalCssWithBeasties().catch(error => { // Mude o nome da função aqui também
    console.error('An unhandled error occurred during "Beasties" Critical CSS generation:', error);
    console.error(error);
    process.exit(1);
});