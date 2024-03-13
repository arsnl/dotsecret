#!/usr/bin/env node

import pkg from "@pkg";
import { getRenderCommand } from "@/cli/render";
import { getCommand } from "@/lib/cli/command";
import { issues } from "@/lib/issue";

const description = `Dotsecret is designed to simplify the process of fetching secrets from secrets managers and render files with them.

It uses configuration and templates files to specify the secrets to fetch and the output files to render. Ideal for automating the creation of .env, .npmrc, and other files you don't want on your git repository.`;

const cli = async () => {
  const command = await getCommand({
    name: pkg.name,
    summary: pkg.description,
    description,
    banner: true,
    commands: { help: true },
  });

  command.version(pkg.version, "-v, --version", `Print version`);

  command.addCommand(await getRenderCommand());

  await command.parseAsync(process.argv);

  issues.counts().total > 0 && (await issues.print());
};

cli().catch(async (error) => {
  issues.error(error);
  await issues.print({ severity: "error" });
  process.exit(1);
});
