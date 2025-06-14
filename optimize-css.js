const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Definição de caminhos
const dir = '_site';
const cssInput = path.join('tailwind.css'); // Seu arquivo de entrada principal
const cssOutput = path.join(dir, 'css', 'main.css'); // Onde o CSS final será salvo

// Função para executar comandos shell
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    // Usamos { shell: true } para que o Windows consiga encontrar npx/tailwindcss
    const child = spawn(command, args, { shell: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => (stdout += data.toString()));
    child.stderr.on('data', (data) => (stderr += data.toString()));

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      // Captura erros como "spawn EINVAL" diretamente
      reject(new Error(`Failed to start command: ${err.message}`));
    });
  });
}

const run = async () => {
  console.log('Starting CSS Optimization with Tailwind CSS...');

  try {
    console.log('Generating and optimizing CSS with Tailwind CLI...');
    // O Tailwind CLI com --minify e JIT (via tailwind.config.js content)
    // já é responsável por purgar o CSS não usado e minificar.
    await runCommand('npx', [
      'tailwindcss',
      '-i',
      cssInput,
      '-o',
      cssOutput,
      '--minify', // Esta flag faz a minificação
    ]);
    console.log('Tailwind CSS generated and optimized.');
  } catch (err) {
    console.error('Tailwind CLI optimization failed:', err.message);
    process.exit(1);
  }

  // Opcional: Adicionar verificação de tamanho final (após o Tailwind)
  let finalCssContent;
  try {
    finalCssContent = await fs.readFile(cssOutput, 'utf8');
    const finalSize = Buffer.byteLength(finalCssContent);
    console.log(`Final CSS size: ${finalSize} bytes.`);
  } catch (err) {
    console.error('Failed to read final CSS for size check:', err.message);
    // Não encerra o processo, pois o CSS já foi gerado
  }

  console.log('CSS Optimization complete.');
};

run().catch((err) => {
  console.error('An unexpected error occurred during CSS optimization:', err.message);
  process.exit(1);
});