// critical-css.mjs
import Critters from 'critters'; // Importe Critters
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

    // Critters pega o CSS de um arquivo ou string
    const globalCssFile = path.join(projectRoot, buildDir, 'assets', 'css', 'style.css');
    const mainCssFile = path.join(projectRoot, buildDir, 'css', 'main.css');

    const critters = new Critters({
        // Opções do Critters
        // Essas opções são para o Critters, não para o Puppeteer.
        // O Critters usará o Puppeteer internamente para renderizar.
        external: false, // Inliza CSS externo
        inlineThreshold: 0, // Inliza tudo para este propósito
        path: buildDir, // Onde os arquivos HTML e CSS estão (base)
        // As opções do Puppeteer vão diretamente para o Critters aqui:
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

            // Critters precisa saber onde o CSS global está.
            // Podemos ler e injetar ou apontar para os arquivos.
            // Para simplificar, Critters pode pegar de múltiplos arquivos.
            const cssContent = [
                await readFile(globalCssFile, 'utf8'),
                await readFile(mainCssFile, 'utf8')
            ].join('\n');

            // Critters processa o HTML e retorna o HTML com CSS inline
            const inlinedHtml = await critters.process(htmlContent);

            // O Critical.js calculava o tamanho do CSS inline.
            // Com Critters direto, o processo é um pouco diferente para o tamanho exato,
            // mas a principal função é inlinar.

            await writeFile(htmlPath, inlinedHtml);

            console.log(`Critical CSS generated and inlined for ${page.url}.`); // Tamanho pode ser mais complexo de calcular aqui

        } catch (error) {
            console.error(`Error generating Critical CSS for ${page.url}:`, error.message);
            // Não falha o build, apenas avisa sobre a página específica
        }
    }
    console.log('Critters Critical CSS generation complete.');
}

generateCriticalCss().catch(error => {
    console.error('An unhandled error occurred during Critters Critical CSS generation:', error);
    process.exit(1); // Falha o build se houver um erro global
});