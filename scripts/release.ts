#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { $ } from "execa";
import { exec } from "node:child_process";
import nodeFs from "node:fs";
import nodePath from "node:path";

const execPromise = (command: string) =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(new Error(stderr));
        return;
      }
      resolve(stdout);
    });
  });

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
    const stdout = await execPromise(
      `npx changeset status --output=${changesetFile}`,
    );
    console.log(stdout);

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
