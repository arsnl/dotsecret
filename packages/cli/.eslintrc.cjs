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
        message: "Please use @/esm-only/boxen instead.",
      },
      {
        name: "chalk",
        message: "Please use @/esm-only/chalk instead.",
      },
      {
        name: "color-json",
        message: "Please use @/esm-only/color-json instead.",
      },
      {
        name: "execa",
        message: "Please use @/esm-only/execa instead.",
      },
      {
        name: "find-up",
        message: "Please use @/esm-only/find-up instead.",
      },
      {
        name: "globby",
        message: "Please use @/esm-only/globby instead.",
      },
      {
        name: "multimatch",
        message: "Please use @/esm-only/multimatch instead.",
      },
      {
        name: "ora",
        message: "Please use @/esm-only/ora instead.",
      },
    ],
  },
};
