import { defineConfig } from 'vite';
import { resolve } from 'path';

// Build background service worker
export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        outDir: 'dist-extension',
        emptyOutDir: false, // Don't clear - content script already built
        lib: {
            entry: resolve(__dirname, 'src/background/background.ts'),
            name: 'Background',
            fileName: () => 'background.js',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
        target: 'chrome100',
        minify: 'esbuild',
    },
});
