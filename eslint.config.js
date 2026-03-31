import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Cross-feature import boundaries — features must not import from each other
  {
    files: ['src/features/dashboard/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/features/overlays/**', '../overlays/**', '../../overlays/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/history/**', '../history/**', '../../history/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/onboarding/**', '../onboarding/**', '../../onboarding/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/settings/**', '../settings/**', '../../settings/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
        ],
      }],
    },
  },
  {
    files: ['src/features/overlays/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/features/dashboard/**', '../dashboard/**', '../../dashboard/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/history/**', '../history/**', '../../history/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/onboarding/**', '../onboarding/**', '../../onboarding/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/settings/**', '../settings/**', '../../settings/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
        ],
      }],
    },
  },
  {
    files: ['src/features/history/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/features/dashboard/**', '../dashboard/**', '../../dashboard/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/overlays/**', '../overlays/**', '../../overlays/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/onboarding/**', '../onboarding/**', '../../onboarding/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/settings/**', '../settings/**', '../../settings/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
        ],
      }],
    },
  },
  {
    files: ['src/features/onboarding/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/features/dashboard/**', '../dashboard/**', '../../dashboard/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/overlays/**', '../overlays/**', '../../overlays/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/history/**', '../history/**', '../../history/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/settings/**', '../settings/**', '../../settings/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
        ],
      }],
    },
  },
  {
    files: ['src/features/settings/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/features/dashboard/**', '../dashboard/**', '../../dashboard/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/overlays/**', '../overlays/**', '../../overlays/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/history/**', '../history/**', '../../history/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
          { group: ['**/features/onboarding/**', '../onboarding/**', '../../onboarding/**'], message: 'Cross-feature imports forbidden. Use hooks/ instead.' },
        ],
      }],
    },
  },
])
