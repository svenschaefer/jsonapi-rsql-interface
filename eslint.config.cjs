module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      }
    },
    rules: {
      eqeqeq: ["error", "always"],
      "no-undef": "error",
      "no-shadow": "error",
      "no-unused-vars": ["error", { args: "after-used", argsIgnorePattern: "^_" }],
      "no-implied-eval": "error",
      "no-global-assign": "error"
    }
  }
];
