#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { type PreState, type ReleasePlan } from "@changesets/types";
import { $ } from "execa";
import nodeFs from "node:fs";
import nodePath from "node:path";

const cwd = nodePath.join(__dirname, "..");
const next = process.argv.includes("--next");
const verbose = process.argv.includes("--verbose");

const hasChangesets = async () => {
  const releasePlanFile = "./release-plan.json";

  try {
    verbose && console.log("Getting changeset status");

    await $({
      cwd,
      verbose,
      stdio: verbose ? "inherit" : undefined,
    })`npx changeset status --output=${releasePlanFile}`;

    const releasePlan = JSON.parse(
      nodeFs.readFileSync(releasePlanFile, "utf-8"),
    ) as ReleasePlan;

    verbose && console.log(JSON.stringify(releasePlan, null, 2));

    return !!releasePlan?.changesets?.length;
  } catch (error) {
    verbose && console.log("Failed to get changeset status");
    verbose && console.error(error);

    return false;
  }
};

const isPreMode = () => {
  try {
    verbose && console.log("Getting pre state");

    const preState = JSON.parse(
      nodeFs.readFileSync(".changeset/pre.json", "utf-8"),
    ) as PreState;

    verbose && console.log(JSON.stringify(preState, null, 2));

    return preState?.mode === "pre";
  } catch (error) {
    verbose && console.log("Failed to get pre state");
    verbose && console.error(error);

    return false;
  }
};

(async () => {
  verbose && console.log("Executing release script");
  verbose && console.log(`cwd: ${cwd}\nnext: ${next}`);

  if (next && !isPreMode()) {
    verbose && console.log("Entering pre mode");

    await $({
      cwd,
      verbose,
      stdio: verbose ? "inherit" : undefined,
    })`npx changeset pre enter next`;

    if (!isPreMode()) {
      console.error("Failed to enter pre mode");
      process.exit(1);
    }
  }

  if (!next && isPreMode()) {
    verbose && console.log("Exiting pre mode");

    await $({
      cwd,
      verbose,
      stdio: verbose ? "inherit" : undefined,
    })`npx changeset pre exit`;

    if (isPreMode()) {
      console.error("Failed to exit pre mode");
      process.exit(1);
    }
  }

  if (!(await hasChangesets())) {
    console.error("No release needed");
    process.exit(0);
  }

  await $({
    cwd,
    verbose,
    stdio: verbose ? "inherit" : undefined,
  })`npx changeset version`;
})();
