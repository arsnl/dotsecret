#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { $, execa } from "execa";
import nodeFs from "node:fs";

const hasChangesets = async () => {
  try {
    await execa("npx", ["changeset", "status"], { stdio: "ignore" });
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

  if (isNext && !isPreMode()) {
    await $`npx changeset pre enter next`;

    if (!isPreMode()) {
      console.error("Failed to enter pre mode");
      process.exit(1);
    }
  }

  if (!isNext && isPreMode()) {
    await $`npx changeset pre exit`;

    if (isPreMode()) {
      console.error("Failed to exit pre mode");
      process.exit(1);
    }
  }

  if (!(await hasChangesets())) {
    console.error("No changeset found");
    process.exit(1);
  }

  await $`npx changeset version`;
})();
