/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["peppy", "peppy/react"],
  parserOptions: { tsconfigRootDir: __dirname, project: "./tsconfig.json" },
  rules: {
    "react/react-in-jsx-scope": "off",
  },
};