import { generate } from 'critical';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const buildDir = '_site';
const projectRoot = process.cwd();

async function generateCriticalCssWithNewTool() {
    console.log('\nStarting Critical CSS generation with "critical" package...');

    const pagesToProcess = [
        { name: 'index.html', url: 'index.html' },
        { name: 'human-machine-learning', url: '2025/05/15/human-machine-learning/index.html' },
        { name: 'article-test', url: '2025/06/07/article-test/index.html' },
    ];

    const globalCssFilePath = path.join(projectRoot, buildDir, 'assets', 'css', 'style.css');
    const mainCssFilePath = path.join(projectRoot, buildDir, 'css', 'main.css');

    try {
        await readFile(globalCssFilePath, 'utf8');
        await readFile(mainCssFilePath, 'utf8');
        console.log('Successfully loaded all combined CSS paths for critical path generation.');
    } catch (error) {
        console.error(`Error loading combined CSS: ${error.message}. Critical CSS generation aborted.`);
        process.exit(1);
    }

    for (const page of pagesToProcess) {
        const htmlPath = path.join(buildDir, page.url);
        try {
            console.log(`\nGenerating Critical CSS for: ${page.url}`);

            const htmlContentBefore = await readFile(htmlPath, 'utf8');
            const htmlSizeBeforeKb = (Buffer.byteLength(htmlContentBefore, 'utf8') / 1024).toFixed(2);

            const { html, css, uncritical } = await generate({
                base: buildDir,
                html: htmlContentBefore,
                css: [globalCssFilePath, mainCssFilePath],
                inline: true,
                extract: false,
                // --- REMOVA A OPÇÃO 'puppeteer' COMPLETA AQUI ---
                // Não adicione nenhuma opção 'browser' ou 'puppeteer' diretamente.
                // Deixe o 'critical' tentar encontrar o navegador sozinho.
            });

            await writeFile(htmlPath, html);

            const htmlSizeAfterKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(2);

            console.log(`  HTML size before "critical": ${htmlSizeBeforeKb} KB`);
            console.log(`  HTML size after "critical" : ${htmlSizeAfterKb} KB`);
            console.log(`  Difference                 : ${(htmlSizeAfterKb - htmlSizeBeforeKb).toFixed(2)} KB (inlined Critical CSS size)`);
            console.log(`Critical CSS generated and inlined for ${page.url}.`);

        } catch (error) {
            console.error(`Error generating Critical CSS for ${page.url}:`, error.message);
        }
    }
    console.log('\n"critical" Critical CSS generation complete.');
}

generateCriticalCssWithNewTool().catch(error => {
    console.error('An unhandled error occurred during "critical" Critical CSS generation:', error);
    process.exit(1);
});