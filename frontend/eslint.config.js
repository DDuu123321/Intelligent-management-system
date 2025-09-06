import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import typescript from "@vue/eslint-config-typescript";
import prettier from "@vue/eslint-config-prettier";
import vitest from "@vitest/eslint-plugin";

export default [
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue,js}"],
  },
  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**"],
  },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  ...typescript(),
  prettier,
  {
    ...vitest.configs.recommended,
    files: [
      "src/**/__tests__/*",
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
  {
    name: "app/vue-rules",
    files: ["**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "warn",
      "vue/no-unused-components": "warn",
      "vue/block-lang": "off",
      "vue/no-reserved-component-names": "warn",
    },
  },
  {
    name: "app/typescript-rules",
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
