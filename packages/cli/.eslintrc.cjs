/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["peppy"],
  parserOptions: { tsconfigRootDir: __dirname, project: "./tsconfig.json" },
  rules: {
    "no-restricted-imports": [
      "error",
      {
        name: "boxen",
        message: "Please use @/vendors/boxen instead.",
      },
      {
        name: "chalk",
        message: "Please use @/vendors/chalk instead.",
      },
      {
        name: "color-json",
        message: "Please use @/vendors/color-json instead.",
      },
      {
        name: "execa",
        message: "Please use @/vendors/execa instead.",
      },
      {
        name: "find-up",
        message: "Please use @/vendors/find-up instead.",
      },
      {
        name: "globby",
        message: "Please use @/vendors/globby instead.",
      },
      {
        name: "multimatch",
        message: "Please use @/vendors/multimatch instead.",
      },
      {
        name: "ora",
        message: "Please use @/vendors/ora instead.",
      },
    ],
  },
};
