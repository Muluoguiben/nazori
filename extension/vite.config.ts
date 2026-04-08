import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
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
        content: resolve(__dirname, 'src/content/index.tsx'),
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
});
