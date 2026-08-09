// ESLint 9 reads flat config only; the previous .eslintrc.js was silently
// unusable, so `npm run lint` failed before it ever looked at a source file.
//
// The rules are the type-checked strict set rather than the old file's
// `recommended`: the parser already builds a program for every source file, so
// the rules that need type information cost nothing extra to switch on, and
// they are the ones that catch the mistakes worth catching here — a floating
// promise on a client that speaks over the network, an unsafe member access on
// a value the compiler only believes is typed.
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: ['build/**', 'dist/**', 'coverage/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // The plugin still ships its configs in eslintrc shape, so only the
      // rules are taken: what its `extends` adds is the parser and plugin
      // wiring, which this flat config already declares above.
      ...tsPlugin.configs['strict-type-checked'].rules,
      // A return type on every exported function is worth having, but the
      // module's public surface already declares them and the decorators do
      // not; turning this on would only add noise to code the compiler
      // already types.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // A NestJS module is a class with only static methods, or none at all:
      // the class is the identity Nest registers and the decorator is the
      // definition. There is no non-class form of it to prefer.
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  prettierRecommended,
];
