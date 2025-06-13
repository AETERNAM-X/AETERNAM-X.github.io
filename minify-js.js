const fs = require('fs').promises;
const path = require('path');
const Terser = require('terser');

const buildDir = '_site';

async function findJsFiles(dir, fileList = []) {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            await findJsFiles(fullPath, fileList);
        } else if (dirent.isFile() && path.extname(fullPath).toLowerCase() === '.js') {
            if (path.basename(fullPath) !== path.basename(__filename)) {
               fileList.push(fullPath);
            }
        }
    }
    return fileList;
}

async function minifyJsFiles() {
    console.log('Starting JavaScript minification with Terser (maximum performance)...');
    const jsFiles = await findJsFiles(buildDir);

    if (jsFiles.length === 0) {
        console.log('No JavaScript files found to minify. Skipping JS minification.');
        return;
    }

    for (const filePath of jsFiles) {
        try {
            const jsContent = await fs.readFile(filePath, 'utf8');
            const originalSize = Buffer.byteLength(jsContent, 'utf8');

            const result = await Terser.minify(jsContent, {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    passes: 3,
                },
                mangle: true,
            });

            if (result.error) {
                console.error(`Error minifying JS ${filePath}:`, result.error);
                continue;
            }

            const minifiedSize = Buffer.byteLength(result.code, 'utf8');
            console.log(`Minified JS: ${filePath} (Original: ${originalSize} bytes, Minified: ${minifiedSize} bytes, Reduction: ${((1 - minifiedSize / originalSize) * 100).toFixed(2)}%)`);
            await fs.writeFile(filePath, result.code);

        } catch (error) {
            console.error(`Failed to minify JS ${filePath}:`, error.message);
        }
    }
    console.log('JavaScript minification complete.');
}

minifyJsFiles().catch(error => {
    console.error('An unhandled error occurred during JS minification:', error);
    process.exit(1);
});