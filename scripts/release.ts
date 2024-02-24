#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { $, execa } from "execa";
import nodeFs from "node:fs";
import nodePath from "node:path";

const cwd = nodePath.join(__dirname, "..");
const next = process.argv.includes("--next");
const verbose = process.argv.includes("--verbose");

const hasChangesets = async () => {
  const changesetFile = "./changeset-status.json";

  try {
    /*
    await $({
      stdio: "ignore",
      cwd,
      verbose,
    })`npx changeset status --since=${next ? "next" : "main"} --output=${changesetFile}`;
    */

    await execa(
      "npx",
      [
        "changeset",
        "status",
        "--since=next",
        "--output=./changeset-status.json",
      ],
      {
        stdio: "ignore",
        cwd,
        verbose,
      },
    );

    const changesetStatus = JSON.parse(
      nodeFs.readFileSync(changesetFile, "utf-8"),
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
      nodeFs.readFileSync(".changeset/pre.json", "utf-8"),
    ) as any;

    return changesetConfig?.mode === "pre";
  } catch {
    return false;
  }
};

(async () => {
  if (verbose) {
    console.log("cwd:", cwd);
    console.log("next:", next);
    console.log("pre:", isPreMode());
    console.log("");
  }

  if (next && !isPreMode()) {
    await $({ cwd })`npx changeset pre enter next`;

    if (!isPreMode()) {
      console.error("Failed to enter pre mode");
      process.exit(1);
    }
  }

  if (!next && isPreMode()) {
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
