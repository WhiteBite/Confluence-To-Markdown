import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: 'Confluence to Markdown Exporter',
                namespace: 'http://tampermonkey.net/',
                version: '2.0.0',
                description: 'Export Confluence pages to clean Markdown for LLM consumption',
                author: 'Your Name',
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
