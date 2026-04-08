import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig(({ mode }) => {
  // Content script must be built as IIFE (no ES module imports allowed in
  // content scripts on older Chrome). We run two build passes:
  //   1. "content" pass: builds only the content script as IIFE
  //   2. default pass: builds everything else as ES modules
  const isContentBuild = process.env.BUILD_TARGET === 'content';

  if (isContentBuild) {
    return {
      plugins: [react()],
      resolve: { alias: { '@shared': resolve(__dirname, 'src/shared') } },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/content/index.tsx'),
          formats: ['iife'],
          name: 'NazoriContent',
          fileName: () => 'content/index.js',
        },
        rollupOptions: {
          output: {
            assetFileNames: 'assets/[name]-[hash][extname]',
          },
        },
      },
      publicDir: false,
    };
  }

  return {
    plugins: [
      react(),
      {
        name: 'fix-html-paths',
        closeBundle() {
          // Vite puts HTML files under dist/src/*, but manifest expects dist/popup/ and dist/options/
          // We copy them and fix the relative paths (../../ → ../)
          const dist = resolve(__dirname, 'dist');
          const moves: [string, string][] = [
            ['src/popup/index.html', 'popup/index.html'],
            ['src/options/index.html', 'options/index.html'],
          ];
          for (const [from, to] of moves) {
            const src = resolve(dist, from);
            const dest = resolve(dist, to);
            if (existsSync(src)) {
              const destDir = resolve(dest, '..');
              if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
              // Read and fix paths: ../../ → ../ (one level shallower)
              let html = readFileSync(src, 'utf-8');
              html = html.replace(/\.\.\/..\//g, '../');
              writeFileSync(dest, html);
            }
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          background: resolve(__dirname, 'src/background/index.ts'),
          popup: resolve(__dirname, 'src/popup/index.html'),
          options: resolve(__dirname, 'src/options/index.html'),
        },
        output: {
          entryFileNames: '[name]/index.js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    publicDir: 'public',
  };
});
