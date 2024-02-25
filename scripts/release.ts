#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { exec } from "@actions/exec";
import { type PreState } from "@changesets/types";
import nodeFs from "node:fs";
import nodePath from "node:path";

const isPreMode = async () => {
  try {
    const preState = JSON.parse(
      await nodeFs.promises.readFile(".changeset/pre.json", "utf-8"),
    ) as PreState;

    return preState?.mode === "pre";
  } catch {
    return false;
  }
};

const enterPreMode = async () => {
  console.log("Entering pre mode");

  await exec("npx", ["changeset", "pre", "enter", "next"]);

  if (!(await isPreMode())) {
    console.error("Failed to enter pre mode");
    process.exit(1);
  }
};

const exitPreMode = async () => {
  console.log("Exiting pre mode");

  await exec("npx", ["changeset", "pre", "exit"]);

  if (await isPreMode()) {
    console.error("Failed to exit pre mode");
    process.exit(1);
  }
};

(async () => {
  const isLatest = process.env.PUBLISH_TAG === "latest";

  process.chdir(nodePath.join(__dirname, ".."));

  if (!isLatest && !(await isPreMode())) {
    await enterPreMode();
  }

  if (isLatest && (await isPreMode())) {
    await exitPreMode();
  }

  await exec("npx", ["changeset", "publish"]);
})();
