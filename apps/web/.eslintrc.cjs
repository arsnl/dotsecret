/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["peppy", "peppy/react"],
  parserOptions: {
    project: true,
  },
  rules: {
    "react/react-in-jsx-scope": "off",
  },
};
