import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

const REPO_URL = 'https://github.com/WhiteBite/Confluence-To-Markdown';
const RAW_URL = 'https://raw.githubusercontent.com/WhiteBite/Confluence-To-Markdown/main/dist/confluence-to-markdown.user.js';

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: 'Confluence to Markdown Exporter',
                namespace: 'https://github.com/WhiteBite/confluence-to-markdown',
                version: '2.3.1',
                description: 'Export Confluence pages to clean Markdown for LLM consumption',
                author: 'WhiteBite',
                homepage: REPO_URL,
                supportURL: `${REPO_URL}/issues`,
                updateURL: RAW_URL,
                downloadURL: RAW_URL,
                match: [
                    'https://*.atlassian.net/wiki/*',
                    'https://*/wiki/*',
                    'https://*/display/*',
                    'https://*/pages/*',
                ],
                icon: 'https://www.atlassian.com/favicon.ico',
                grant: ['GM_xmlhttpRequest', 'GM_addStyle'],
                connect: ['*'],
            },
            build: {
                fileName: 'confluence-to-markdown.user.js',
            },
        }),
    ],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
