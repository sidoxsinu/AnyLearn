import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const PROJECT_ROOT = process.cwd();
const mockNavUrl = pathToFileURL(path.resolve(PROJECT_ROOT, 'tests/mock_navigation.mjs')).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/navigation') {
    return {
      format: 'module',
      shortCircuit: true,
      url: mockNavUrl,
    };
  }

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

export async function load(url, context, nextLoad) {
  if (url.endsWith('.tsx') || url.endsWith('.ts')) {
    const filePath = fileURLToPath(url);
    const source = fs.readFileSync(filePath, 'utf8');
    const result = ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: filePath,
    });
    return {
      format: 'module',
      shortCircuit: true,
      source: result.outputText,
    };
  }
  return nextLoad(url, context);
}
