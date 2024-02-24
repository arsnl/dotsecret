#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { type PreState, type ReleasePlan } from "@changesets/types";
import chalk from "chalk";
import { $ } from "execa";
import nodeFs from "node:fs";
import nodePath from "node:path";

const cwd = nodePath.join(__dirname, "..");
const next = process.argv.includes("--next");
const verbose = process.argv.includes("--verbose");

const verboseBlock = ({ title, content }: { title: string; content: any }) => {
  if (verbose) {
    console.log(chalk.cyan.bold(`\n${title}`));
    console.log(content);
    console.log("\n");
  }
};

const hasChangesets = async () => {
  const releasePlanFile = "./release-plan.json";

  try {
    verbose && console.log(chalk.cyan.bold("Getting changeset status"));

    await $({
      cwd,
      verbose,
      stdio: verbose ? "inherit" : undefined,
    })`npx changeset status --output=${releasePlanFile}`;

    const releasePlan = JSON.parse(
      nodeFs.readFileSync(releasePlanFile, "utf-8"),
    ) as ReleasePlan;

    verboseBlock({
      title: "Release Plan",
      content: JSON.stringify(releasePlan, null, 2),
    });

    return !!releasePlan?.changesets?.length;
  } catch (error) {
    verboseBlock({
      title: "Failed to get changeset status",
      content: error,
    });

    return false;
  }
};

const isPreMode = () => {
  try {
    verbose && console.log(chalk.cyan.bold("Getting pre state"));

    const preState = JSON.parse(
      nodeFs.readFileSync(".changeset/pre.json", "utf-8"),
    ) as PreState;

    verboseBlock({
      title: "Pre State",
      content: JSON.stringify(preState, null, 2),
    });

    return preState?.mode === "pre";
  } catch (error) {
    verboseBlock({
      title: "Failed to get pre state",
      content: error,
    });

    return false;
  }
};

(async () => {
  verboseBlock({
    title: "Executing release script",
    content: `cwd: ${cwd}\nnext: ${next}`,
  });

  if (next && !isPreMode()) {
    verbose && console.log(chalk.cyan.bold("Entering pre mode"));

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
    verbose && console.log(chalk.cyan.bold("Exiting pre mode"));

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
