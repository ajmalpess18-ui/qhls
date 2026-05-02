import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHoghjklhgffghjklmnbvcvbnm,mnbvcvbnmbvcvbnmjhgfghjkjhgfhjklkjhgfgnmbvcvbnmhgfghjkjhgfgmngfnmnbvbnm,mnbgfdfghjkkjhgfghhgfgm,mnhgfbnmcn5hgfrrkjhgfghjhgfdghjlkjhgfghjkjhgfdfghjkllkjhgfdfghjklkjherthjkl.,mnbvcxhgfdsdfbn.,mnbm,./.lkjhgjklkjhgfhjklkjhnmmn uilkjuklkjhghjm,./,mnbvbnm,./.,mjnhgfghjkl/lkjhgfhj,./.,mnhgfdfgbn45tyuiop4tyuiop34r5tyuiop[ertyuiopertyjkmnblkjhgoks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
