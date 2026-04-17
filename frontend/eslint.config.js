// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
        // You can optionally target only TS/TSX files
        files: ["**/*.{ts,tsx}"], 
        rules: {
            // 1. Turn off the base JavaScript rule so it doesn't conflict
            "no-shadow": "off", 
            
            // 2. Turn on the TypeScript-aware rule
            "@typescript-eslint/no-shadow": "error" 
        }
    }
]);
