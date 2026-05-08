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
                name: 'Confluence to Markdown Exporter',
                namespace: 'https://github.com/WhiteBite/confluence-to-markdown',
                version: pkg.version,
                description: 'Export Confluence pages to clean Markdown for LLM consumption',
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
                ],
                icon: 'https://www.atlassian.com/favicon.ico',
                grant: ['GM_xmlhttpRequest', 'GM_addStyle', 'GM_download'],
                connect: ['*'],
            },
            build: {
                fileName: 'confluence-to-markdown.user.js',
            },
        }),
    ],
    build: {
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                sequences: false, // disable comma operators for cleaner bundle
            },
            mangle: true,
        },
        rollupOptions: {
            output: {
                format: 'iife',
            },
        },
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
