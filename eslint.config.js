import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		files: ['*.ts'],
		extends: ['plugin:@nrwl/nx/typescript', 'plugin:import/recommended', 'plugin:import/typescript'],
		rules: {
			'@nrwl/nx/enforce-module-boundaries': [
				'error',
				{
					enforceBuildableLibDependency: true,
					allow: [],
					depConstraints: [
						{
							sourceTag: '*',
							onlyDependOnLibsWithTags: ['*']
						}
					]
				}
			],

			'brace-style': ['error', '1tbs'],
			curly: 'error',
			'consistent-return': 'error',

			'@typescript-eslint/explicit-member-accessibility': [
				'error',
				{
					accessibility: 'explicit',
					overrides: {
						constructors: 'no-public'
					}
				}
			],
			'@typescript-eslint/explicit-module-boundary-types': 'off', // generally handled by strict mode
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{
					allowExpressions: true
				}
			],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-inferrable-types': 'off', // I prefer the verbosity
			'@typescript-eslint/no-parameter-properties': ['error', { allows: ['private readonly'] }],
			'@typescript-eslint/no-unused-vars': 'error',
			'max-len': 'off', // checked by prettier

			'@typescript-eslint/no-empty-function': ['error'],

			'sort-imports': [
				'error',
				{
					ignoreDeclarationSort: true,
					ignoreCase: true
				}
			],
			'import/order': [
				'error',
				{
					alphabetize: {
						order: 'asc',
						caseInsensitive: true
					},
					pathGroups: [
						{
							pattern: '@shoppi/**',
							group: 'external',
							position: 'after'
						}
					],
					groups: ['builtin', 'external', ['parent', 'sibling'], 'object']
				}
			],
			'prettier/prettier': ['error']
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	}
];
