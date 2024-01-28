/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["peppy", "peppy/react"],
  parserOptions: {
    project: "./tsconfig.lint.json",
  },
  rules: {
    "react/react-in-jsx-scope": "off",
  },
};
