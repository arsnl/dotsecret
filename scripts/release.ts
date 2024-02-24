#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { $ } from "execa";
import nodeFs from "node:fs";
import nodePath from "node:path";

const cwd = nodePath.join(__dirname, "..");
const changesetStatusPath = nodePath.join(cwd, "changeset-status.json");
const changesetPrePath = nodePath.join(cwd, ".changeset/pre.json");
const isNext = process.argv.includes("--next");
const verbose = process.argv.includes("--verbose");

const hasChangesets = async () => {
  const cmd = `npx changeset status --since=${isNext ? "next" : "main"}  --output=${changesetStatusPath}`;

  try {
    verbose && console.log(`Running: ${cmd}`);

    await $({ stdio: "ignore", cwd })`${cmd}`;

    const changesetStatus = JSON.parse(
      nodeFs.readFileSync(changesetStatusPath, "utf-8"),
    ) as { changesets: any[]; releases: any[] };

    verbose && console.log("Changeset status:", changesetStatus);

    return !!changesetStatus?.changesets?.length;
  } catch (error) {
    verbose && console.log("Failed to get changeset status");
    verbose && console.error(error);

    return false;
  }
};

const isPreMode = () => {
  try {
    const changesetConfig = JSON.parse(
      nodeFs.readFileSync(changesetPrePath, "utf-8"),
    ) as any;

    return changesetConfig?.mode === "pre";
  } catch {
    return false;
  }
};

(async () => {
  if (verbose) {
    console.log("Current directory:", cwd);
    console.log("Changeset status path:", changesetStatusPath);
    console.log("Is next:", isNext);
    console.log("Changeset pre path:", changesetPrePath);
    console.log("Is pre mode:", isPreMode());
  }

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

  if (!(await hasChangesets())) {
    console.error("No release needed");
    process.exit(0);
  }

  await $({ cwd })`npx changeset version`;
})();
