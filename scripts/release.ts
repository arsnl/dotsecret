#!/usr/bin/env node
/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { exec, getExecOutput } from "@actions/exec";
import { type PreState, type ReleasePlan } from "@changesets/types";
import nodeFs from "node:fs";
import nodeOs from "node:os";
import nodePath from "node:path";

const createNpmrc = async ({
  token,
  verbose,
}: {
  token: string;
  verbose: boolean;
}) => {
  const content = `//registry.npmjs.org/:_authToken=${token}\n`;
  const path = `${nodeOs.homedir()}/.npmrc`;

  await nodeFs.promises.writeFile(path, content);

  if (!nodeFs.existsSync(path)) {
    console.error("Failed to create .npmrc file");
    process.exit(1);
  }

  verbose && console.log(`.npmrc file created at ${path}`);
};

const hasChangesets = async ({ verbose }: { verbose: boolean }) => {
  const releasePlanFile = "./release-plan.json";

  try {
    verbose && console.log("Getting changeset status");

    await exec("npx", ["changeset", "status", `--output=${releasePlanFile}`]);

    const releasePlan = JSON.parse(
      await nodeFs.promises.readFile(releasePlanFile, "utf-8"),
    ) as ReleasePlan;

    verbose && console.log(JSON.stringify(releasePlan, null, 2));

    return !!releasePlan?.changesets?.length;
  } catch (error) {
    verbose && console.log("Failed to get changeset status");
    verbose && console.error(error);

    return false;
  }
};

const bump = async ({ verbose }: { verbose: boolean }) => {
  try {
    verbose && console.log("Bumping version");

    await exec("npx", ["changeset", "version"]);
  } catch (error) {
    console.error("Failed to bump version");
    console.error(error);
    process.exit(1);
  }
};

const getVersion = async ({ verbose }: { verbose: boolean }) => {
  try {
    verbose && console.log("Getting version");

    const packageJson = JSON.parse(
      await nodeFs.promises.readFile("packages/cli/package.json", "utf-8"),
    ) as { version: string };

    const version = packageJson?.version;
    const tag = `v${version}`;

    verbose && console.log(`version: ${version}, tag: ${tag}`);

    return { version, tag };
  } catch (error) {
    console.log("Failed to get version");
    console.error(error);
    process.exit(1);
  }
};

const validateTag = async ({
  tag,
  verbose,
}: {
  tag: string;
  verbose: boolean;
}) => {
  verbose && console.log("Validating tag");

  const { exitCode, stderr } = await getExecOutput(
    `git`,
    ["ls-remote", "--exit-code", "origin", "--tags", `refs/tags/${tag}`],
    {
      ignoreReturnCode: true,
    },
  );
  if (exitCode === 0) {
    console.log(
      `Action is not being published because version ${tag} is already published`,
    );
    process.exit(1);
  }
  if (exitCode !== 2) {
    console.error(`git ls-remote exited with ${exitCode}:\n${stderr}`);
    process.exit(1);
  }
};

const isPreMode = async ({ verbose }: { verbose: boolean }) => {
  try {
    verbose && console.log("Getting pre state");

    const preState = JSON.parse(
      await nodeFs.promises.readFile(".changeset/pre.json", "utf-8"),
    ) as PreState;

    verbose && console.log(JSON.stringify(preState, null, 2));

    return preState?.mode === "pre";
  } catch (error) {
    verbose && console.log("Failed to get pre state");
    verbose && console.error(error);

    return false;
  }
};

const enterPreMode = async ({ verbose }: { verbose: boolean }) => {
  verbose && console.log("Entering pre mode");

  await exec("npx", ["changeset", "pre", "enter", "next"]);

  if (!(await isPreMode({ verbose }))) {
    console.error("Failed to enter pre mode");
    process.exit(1);
  }
};

const exitPreMode = async ({ verbose }: { verbose: boolean }) => {
  verbose && console.log("Exiting pre mode");

  await exec("npx", ["changeset", "pre", "exit"]);

  if (await isPreMode({ verbose })) {
    console.error("Failed to exit pre mode");
    process.exit(1);
  }
};

(async () => {
  const next = process.argv.includes("--next");
  const verbose = process.argv.includes("--verbose");
  const { NPM_TOKEN, GITHUB_TOKEN } = process.env;

  if (!NPM_TOKEN) {
    console.error("NPM_TOKEN is not set");
    process.exit(1);
  }
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is not set");
    process.exit(1);
  }

  process.chdir(nodePath.join(__dirname, ".."));

  if (next && !(await isPreMode({ verbose }))) {
    await enterPreMode({ verbose });
  }

  if (!next && (await isPreMode({ verbose }))) {
    await exitPreMode({ verbose });
  }

  if (!(await hasChangesets({ verbose }))) {
    console.error("No release needed");
    process.exit(0);
  }

  await bump({ verbose });
  const version = await getVersion({ verbose });
  await validateTag({ tag: version.tag, verbose });
  await createNpmrc({ token: NPM_TOKEN, verbose });
})();
