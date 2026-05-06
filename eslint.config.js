import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import userscripts from 'eslint-plugin-userscripts';

export default [
    // Global ignores — replaces .eslintignore
    {
        ignores: [
            'dist/**',
            'dist-extension/**',
            'node_modules/**',
            '*.user.js',
        ],
    },
    // Base recommended configs
    js.configs.recommended,
    ...tseslint.configs.recommended,
    // TypeScript source & declaration files
    {
        files: ['src/**/*.ts', 'src/**/*.d.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                // Tampermonkey / Greasemonkey
                GM_xmlhttpRequest: 'readonly',
                GM_addStyle: 'readonly',
                GM_getValue: 'readonly',
                GM_setValue: 'readonly',
                GM_info: 'readonly',
                unsafeWindow: 'readonly',
                // Browser
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                MutationObserver: 'readonly',
                alert: 'readonly',
                location: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                atob: 'readonly',
                btoa: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                chrome: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-sequences': 'error',
            'no-return-assign': 'error',
            'preserve-caught-error': 'off',
        },
    },
    // Declaration files — no unused-vars noise
    {
        files: ['src/**/*.d.ts'],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    // Userscript entry
    {
        files: ['src/main.ts'],
        plugins: { userscripts: userscripts },
        rules: {
            'userscripts/better-use-match': 'warn',
            'userscripts/compat-grant': 'warn',
            'userscripts/compat-headers': 'warn',
        },
        settings: {
            userscriptVersions: {
                violentmonkey: '*',
                tampermonkey: '*',
                greasemonkey: '*',
            },
        },
    },
    // Built userscript
    {
        files: ['dist/*.user.js'],
        rules: {
            'no-sequences': 'off',
            'no-return-assign': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
];
