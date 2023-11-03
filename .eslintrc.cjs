/* global module */
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  overrides: [
  ],
  globals: {
    document: true,
    navigator: true,
    window: true
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: [
    "react"
  ],
  rules: {
    semi: ["warn", "always"],
    quotes: ["warn", "double", {
      avoidEscape: true, 
      allowTemplateLiterals: true 
    }],
    "no-unused-vars": ["warn" /*, {args: "none"}*/],
    "no-multiple-empty-lines": ["warn", {max: 4}],
    "comma-dangle": ["error", "never"]  
  }
};
