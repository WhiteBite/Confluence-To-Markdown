/**
 * Debug / non-minified build config.
 * Produces `confluence-to-markdown.debug.user.js` — same code but readable,
 * with console.log preserved for debugging.
 *
 * Usage:  npm run build:debug
 */
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json' assert { type: 'json' };

const REPO_URL = 'https://github.com/WhiteBite/Confluence-To-Markdown';
const PAGES_URL = 'https://whitebite.github.io/Confluence-To-Markdown/confluence-to-markdown.user.js';

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: 'Confluence to Markdown Exporter (Debug)',
                namespace: 'https://github.com/WhiteBite/confluence-to-markdown',
                version: pkg.version,
                description: 'Export Confluence pages to clean Markdown (debug build — readable, with console)',
                author: 'WhiteBite',
                homepage: REPO_URL,
                supportURL: `${REPO_URL}/issues`,
                updateURL: PAGES_URL,
                downloadURL: PAGES_URL,
                match: [
                    'https://*.atlassian.net/wiki/*',
                    'https://*/wiki/*',
                    'https://*/display/*',
                    'https://*/pages/*',
                    'https://*/confluence/*',
                    'http://*/wiki/*',
                    'http://*/display/*',
                    'http://*/pages/*',
                    'http://*/confluence/*',
                ],
                icon: 'https://www.atlassian.com/favicon.ico',
                grant: ['GM_xmlhttpRequest', 'GM_addStyle', 'GM_download', 'GM_setValue', 'GM_getValue'],
                connect: ['*'],
            },
            build: {
                fileName: 'confluence-to-markdown.debug.user.js',
            },
        }),
    ],
    build: {
        minify: false,
        sourcemap: false,
        emptyOutDir: false, // keep minified build in dist/
        rollupOptions: {
            output: {
                format: 'iife',
                banner: '/* eslint-disable */',
            },
        },
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
