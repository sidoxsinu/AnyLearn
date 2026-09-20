import { registerHooks, register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PROJECT_ROOT = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  let target = specifier;

  // Handle @/ alias
  if (target.startsWith('@/')) {
    const relativePath = target.slice(2);
    const resolvedPath = path.resolve(PROJECT_ROOT, 'src', relativePath);
    for (const ext of ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx', '/index.js']) {
      const candidate = resolvedPath + ext;
      if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }

  // Handle relative imports without extensions
  if (target.startsWith('./') || target.startsWith('../')) {
    if (context.parentURL) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const resolvedPath = path.resolve(parentDir, target);
      for (const ext of ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx', '/index.js']) {
        const candidate = resolvedPath + ext;
        if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
  }

  return nextResolve(specifier, context);
}

if (typeof registerHooks === 'function') {
  registerHooks({ resolve });
} else {
  register('./loader.mjs', import.meta.url);
}
