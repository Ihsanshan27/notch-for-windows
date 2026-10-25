const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const cargoBin = path.join(os.homedir(), '.cargo', 'bin');
const env = { ...process.env };
env.PATH = cargoBin + path.delimiter + (env.PATH || '');

console.log('Building Tauri application with Cargo at:', cargoBin);

const isDev = process.argv.includes('--dev');
const args = isDev ? ['tauri', 'dev'] : ['tauri', 'build'];

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npx, args, {
  env,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
