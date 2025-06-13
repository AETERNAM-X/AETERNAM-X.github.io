import * as critical from 'critical';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const buildDir = '_site';
const projectRoot = process.cwd();

async function generateCriticalCss() {
    console.log('\nStarting Critical CSS generation with Critical.js...');

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

    const styleCssPath = path.join(projectRoot, buildDir, 'assets', 'css', 'style.css');
    const mainCssPath = path.join(projectRoot, buildDir, 'css', 'main.css');

    for (const page of pagesToProcess) {
        const htmlPath = path.join(buildDir, page.url);

        try {
            console.log(`Generating Critical CSS for: ${page.url}`);

            const { css, html } = await critical.generate({
                html: await readFile(htmlPath, 'utf8'),
                css: [
                    styleCssPath,
                    mainCssPath
                ],
                base: path.join(projectRoot, buildDir),
                inline: true,
                extract: false,
                // --- ESTA PARTE É CRÍTICA E PRECISA ESTAR AQUI ---
                puppeteer: {
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--single-process' // Adicionando para mais compatibilidade em ambientes com memória/CPU limitada
                    ]
                }
                // --- FIM DA PARTE CRÍTICA ---
            });

            let criticalCssSize = 0;
            const styleTagMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            if (styleTagMatch && styleTagMatch[1]) {
                criticalCssSize = Buffer.byteLength(styleTagMatch[1], 'utf8');
            } else {
                console.log(`[INFO] Nenhuma tag <style> inlinhada encontrada em ${page.url}. (Tamanho 0 bytes)`);
            }

            await writeFile(htmlPath, html);

            console.log(`Critical CSS generated and inlined for ${page.url}. Size: ${criticalCssSize} bytes.`);

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