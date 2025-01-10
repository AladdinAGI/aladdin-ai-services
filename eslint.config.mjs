import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
	eslint.configs.recommended,
	{
		files: ['src/**/*.{js,ts}'],
		languageOptions: {
			parser: parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		env: {
			node: true,
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
		},
		ignores: ['dist', 'node_modules', 'coverage'],
	},
];
