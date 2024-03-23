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
        message:
          'Please use `const { default: boxen } = await import("boxen");` instead.',
      },
      {
        name: "chalk",
        message:
          'Please use `const { default: chalk } = await import("chalk");` instead.',
      },
      {
        name: "color-json",
        message:
          'Please use `const { default: colorJson } = await import("color-json");` instead.',
      },
      {
        name: "execa",
        message:
          'Please use `const { execa, $ } = await import("execa");` instead.',
      },
      {
        name: "find-up",
        message:
          'Please use `const { findUp } = await import("find-up");` instead.',
      },
      {
        name: "globby",
        message:
          'Please use `const { globby } = await import("globby");` instead.',
      },
      {
        name: "multimatch",
        message:
          'Please use `const { default: multimatch } = await import("multimatch");` instead.',
      },
      {
        name: "ora",
        message:
          'Please use `const { default: ora } = await import("ora");` instead.',
      },
      {
        name: "update-notifier",
        message:
          'Please use `const { default: updateNotifier } = await import("update-notifier")` instead.',
      },
    ],
  },
};
