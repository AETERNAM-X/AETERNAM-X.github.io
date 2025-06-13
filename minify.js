const fs = require('fs').promises;
const path = require('path');
const htmlnano = require('htmlnano');

const buildDir = '_site';

async function findHtmlFiles(dir, fileList = []) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            await findHtmlFiles(fullPath, fileList);
        } else if (dirent.isFile() && path.extname(fullPath).toLowerCase() === '.html') {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

async function minifyHtmlFiles() {
    console.log('Starting HTML minification with htmlnano (maximum aggression)...');
    const htmlFiles = await findHtmlFiles(buildDir);

    if (htmlFiles.length === 0) {
        console.log('No HTML files found to minify. Skipping HTML minification.');
        return;
    }

    const htmlnanoOptions = {
        removeComments: true,
        removeAttributeQuotes: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCss: true,
        minifyJs: true,
    };

    for (const filePath of htmlFiles) {
        try {
            let htmlContent = await fs.readFile(filePath, 'utf8');
            const originalSize = Buffer.byteLength(htmlContent, 'utf8');

            htmlContent = htmlContent.replace(/<script(?![^>]*\s(?:async|defer))(?=[^>]*\ssrc="[^"]*")[^>]*>/g, '<script defer$&');

            const minifiedResult = await htmlnano.process(htmlContent, htmlnanoOptions);

            const minifiedSize = Buffer.byteLength(minifiedResult.html, 'utf8');
            console.log(`Minified: ${filePath} (Original: ${originalSize} bytes, Minified: ${minifiedSize} bytes, Reduction: ${((1 - minifiedSize / originalSize) * 100).toFixed(2)}%)`);
            await fs.writeFile(filePath, minifiedResult.html);

        } catch (error) {
            console.error(`Error minifying ${filePath}:`, error.message);
            process.exit(1);
        }
    }
    console.log('HTML minification complete.');
}

minifyHtmlFiles().catch(error => {
    console.error('An unhandled error occurred during HTML minification:', error);
    process.exit(1);
});