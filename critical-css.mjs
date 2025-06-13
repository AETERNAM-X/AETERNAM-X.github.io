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

    // Caminhos absolutos para os arquivos CSS otimizados
    const styleCssPath = path.join(projectRoot, buildDir, 'assets', 'css', 'style.css');
    const mainCssPath = path.join(projectRoot, buildDir, 'css', 'main.css');

    for (const page of pagesToProcess) {
        const htmlPath = path.join(buildDir, page.url);

        try {
            console.log(`Generating Critical CSS for: ${page.url}`);

            // A função critical.generate aceita várias opções.
            // Aqui, passamos o HTML como string e os caminhos CSS como array.
            const { css, html } = await critical.generate({
                html: await readFile(htmlPath, 'utf8'), // Lê o HTML do arquivo
                // Caminhos CSS que o critical deve analisar. Eles precisam ser absolutos.
                // O critical é mais flexível e aceita o array de caminhos.
                css: [
                    styleCssPath,
                    mainCssPath
                ],
                // base é o diretório raiz para resolver caminhos relativos no CSS (e.g., url(../images/bg.png))
                base: path.join(projectRoot, buildDir),
                inline: true, // Inlina o CSS crítico diretamente no HTML
                extract: false, // Não extrai o CSS não-crítico para um arquivo separado (mantém nos links)
                // minify: true, // critical já minifica o CSS crítico por padrão
            });

            // O 'html' retornado por critical.generate já é o HTML com o CSS crítico inlinhado
            // e as tags <link> originais (possivelmente modificadas/removidas pelo critical).

            let criticalCssSize = 0;
            // critical.generate já faz o inlining. Podemos verificar o CSS inlinhado no 'html'
            const styleTagMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            if (styleTagMatch && styleTagMatch[1]) {
                criticalCssSize = Buffer.byteLength(styleTagMatch[1], 'utf8');
            } else {
                console.log(`[INFO] Nenhuma tag <style> inlinhada encontrada em ${page.url}. (Tamanho 0 bytes)`);
            }

            await writeFile(htmlPath, html); // Salva o HTML modificado

            console.log(`Critical CSS generated and inlined for ${page.url}. Size: ${criticalCssSize} bytes.`);

        } catch (error) {
            console.error(`Error generating Critical CSS for ${page.url}:`, error.message);
            // Se houver um erro, ainda queremos que o build continue, mas logamos o problema.
        }
    }
    console.log('Critical CSS generation complete.');
}

generateCriticalCss().catch(error => {
    console.error('An unhandled error occurred during Critical CSS generation:', error);
    process.exit(1);
});