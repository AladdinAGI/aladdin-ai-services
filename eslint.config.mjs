import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
	eslint.configs.recommended,
	{
		// 首先定义忽略的文件
		ignores: ['**/dist/**', '**/examples/**', '**/node_modules/**', '**/coverage/**'],
	},
	{
		// 然后定义要检查的文件
		files: ['**/*.{js,ts}'], // 匹配所有 js/ts 文件
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
	},
];
