import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const loaderPath = path.resolve(__dirname, 'loader.mjs');

const args = [
  '--experimental-strip-types',
  '--loader', loaderPath,
  '--test',
  ...process.argv.slice(2)
];

const child = spawn(process.execPath, args, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
