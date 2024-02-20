#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { $ } from "execa";
import nodeFs from "node:fs";
import nodePath from "node:path";

const cwd = nodePath.join(__dirname, "..");

const hasChangesets = async () => {
  try {
    await $({ stdio: "ignore", cwd })`npx changeset status`;
    return true;
  } catch {
    return false;
  }
};

const isPreMode = () => {
  try {
    const changesetConfig = JSON.parse(
      nodeFs.readFileSync("./.changeset/pre.json", "utf-8"),
    ) as any;

    return changesetConfig?.mode === "pre";
  } catch {
    return false;
  }
};

(async () => {
  const isNext = process.argv.includes("--next");

  await $({ cwd, stdio: "inherit" })`ls .changeset`;

  if (isNext && !isPreMode()) {
    await $({ cwd })`npx changeset pre enter next`;

    if (!isPreMode()) {
      console.error("Failed to enter pre mode");
      process.exit(1);
    }
  }

  if (!isNext && isPreMode()) {
    await $({ cwd })`npx changeset pre exit`;

    if (isPreMode()) {
      console.error("Failed to exit pre mode");
      process.exit(1);
    }
  }

  await $({ cwd, stdio: "inherit" })`ls .changeset`;

  if (!(await hasChangesets())) {
    console.log("No changeset found. No release needed.");
    process.exit(0);
  }

  await $({ cwd })`npx changeset version`;
})();
