#!/usr/bin/env node

import pkg from "@pkg";
import { getRenderCommand } from "@/commands/render";
import { getCommand } from "@/libs/command";
import { getIssuesCollector } from "@/libs/issue";

const description = `Dotsecret is designed to simplify the process of fetching secrets from secrets managers and render files with them.

It uses configuration and templates files to specify the secrets to fetch and the output files to render. Ideal for automating the creation of .env, .npmrc, and other files you don't want on your git repository.`;

const cli = async () => {
  const command = getCommand({
    name: "dotsecret",
    summary: pkg.description,
    description,
    banner: true,
    commands: { help: true },
  });

  command.version(pkg.version, "-v, --version", `Print version`);

  command.addCommand(await getRenderCommand());

  await command.parseAsync(process.argv);
};

cli().catch((error) => {
  const issuesCollector = getIssuesCollector().addError(error);
  issuesCollector.print({ severity: "error" });
  process.exit(1);
});
