const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const cargoBin = path.join(os.homedir(), '.cargo', 'bin');

// Di Windows, nama variabel PATH bisa 'Path', 'PATH', atau 'path'
const env = { ...process.env };
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'PATH';
const currentPath = env[pathKey] || '';

// Pastikan cargoBin berada di posisi paling depan PATH
env[pathKey] = cargoBin + path.delimiter + currentPath;

const isDev = process.argv.includes('--dev');
const action = isDev ? 'dev' : 'build';

console.log(`🚀 Starting Tauri (${action}) with Cargo from: ${cargoBin}`);

// Cek binary tauri lokal di node_modules/.bin
const localTauriCmd = path.join(__dirname, '../node_modules/.bin/tauri.cmd');
const localTauri = path.join(__dirname, '../node_modules/.bin/tauri');

let command = 'npx';
let args = ['tauri', action];

if (fs.existsSync(localTauriCmd)) {
  command = localTauriCmd;
  args = [action];
} else if (fs.existsSync(localTauri)) {
  command = localTauri;
  args = [action];
}

const child = spawn(command, args, {
  env,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
