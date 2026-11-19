// Minimal ESLint flat config (spec gap: spec-driven.md defines `npm run lint`
// as `eslint .` but ships no config). Keep it small; extend per feature needs.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results', '.claude/.state'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
)