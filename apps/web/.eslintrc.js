/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["peppy", "peppy/next"],
  parserOptions: {
    project: true,
  },
};
