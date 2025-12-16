import { defineConfig } from 'vite';
import { resolve } from 'path';

// Build content script
export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    build: {
        outDir: 'dist-extension',
        emptyOutDir: true,
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'ConfluenceToMarkdown',
            fileName: () => 'content.js',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                        return 'styles.css';
                    }
                    return '[name].[ext]';
                },
                inlineDynamicImports: true,
            },
        },
        target: 'chrome100',
        minify: 'esbuild',
        cssCodeSplit: false,
    },
});
