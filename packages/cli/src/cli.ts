#!/usr/bin/env node

import pkg from "@pkg";
import { getAuditCommand } from "@/commands/audit";
import { getConfigCommand } from "@/commands/config";
import { getProjectsCommand } from "@/commands/projects";
import { getSecretsCommand } from "@/commands/secrets";
import { getStoreCommand } from "@/commands/store";
import { getTemplatesCommand } from "@/commands/templates";
import { getTokensCommand } from "@/commands/tokens";
import { getCommand } from "@/services/command";
import { getIssuesCollector } from "@/services/issue";

const description = `Vaulty is designed to simplify the process of fetching secrets from Vault and generating files.

It uses configuration and templates files to specify the secrets to fetch and the output files to generate. Ideal for automating the creation of .env, .npmrc, and other files you don't want on your git repository.`;

const run = async () => {
  const command = getCommand({
    name: "vaulty",
    summary: pkg.description,
    description,
    banner: true,
    commands: { help: true },
  });

  command.version(pkg.version, "-v, --version", `Print version`);

  command.addCommand(await getTemplatesCommand());
  command.addCommand(await getSecretsCommand());
  command.addCommand(await getProjectsCommand());
  command.addCommand(await getConfigCommand());
  command.addCommand(await getTokensCommand());
  command.addCommand(await getStoreCommand());
  command.addCommand(await getAuditCommand());

  await command.parseAsync(process.argv);
};

run().catch((error) => {
  const issuesCollector = getIssuesCollector().addError(error);
  issuesCollector.print({ severity: "error" });
  process.exit(1);
});
