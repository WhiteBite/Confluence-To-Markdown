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
                sequences: false,       // no comma operators (ESLint no-sequences)
                conditionals: false,    // no ternary merging (keeps if/else readable)
                dead_code: true,
                evaluate: true,
                unused: true,
            },
            mangle: true,
            format: {
                semicolons: true,       // use semicolons (not ASI)
                braces: true,           // always use braces for blocks
            },
        },
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
