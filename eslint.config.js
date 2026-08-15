import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
    {
        ignores: [
            'dist',
            'node_modules',
            'public/build',
            'vendor',
            'resources/js/routes/**',
            'resources/js/actions/**',
            'bootstrap/cache/**',
            'storage/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        ...reactHooks.configs.flat.recommended,
        plugins: {
            'react-refresh': reactRefresh,
        },
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                History: 'readonly',
                Location: 'readonly',
                FormData: 'readonly',
            },
        },
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-undef': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },
);
