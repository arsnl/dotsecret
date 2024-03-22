#!/usr/bin/env node

import { getAuditCommand } from "@/cli/audit";
import { getCleanCommand } from "@/cli/clean";
import { getDiffCommand } from "@/cli/diff";
import { getFixCommand } from "@/cli/fix";
import { getIgnoreCommand } from "@/cli/ignore";
import { getInitCommand } from "@/cli/init";
import { getLoginCommand } from "@/cli/login";
import { getLogoutCommand } from "@/cli/logout";
import { getOpenCommand } from "@/cli/open";
import { getPullCommand } from "@/cli/pull";
import { getPushCommand } from "@/cli/push";
import { getRenderCommand } from "@/cli/render";
import { getRenewCommand } from "@/cli/renew";
import { getVersionsCommand } from "@/cli/versions";
import { getWhoamiCommand } from "@/cli/whoami";
import { getCommand } from "@/lib/cli";
import { issues } from "@/lib/issue";
import pkg from "@/lib/package-json";

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

  command.addCommand(await getInitCommand());
  command.addCommand(await getLoginCommand());
  command.addCommand(await getLogoutCommand());
  command.addCommand(await getWhoamiCommand());
  command.addCommand(await getRenewCommand());
  command.addCommand(await getOpenCommand());
  command.addCommand(await getPullCommand());
  command.addCommand(await getPushCommand());
  command.addCommand(await getVersionsCommand());
  command.addCommand(await getDiffCommand());
  command.addCommand(await getRenderCommand());
  command.addCommand(await getCleanCommand());
  command.addCommand(await getIgnoreCommand());
  command.addCommand(await getAuditCommand());
  command.addCommand(await getFixCommand());

  await command.parseAsync(process.argv);

  issues.counts().total > 0 && (await issues.print());
};

cli().catch(async (error) => {
  issues.error(error);
  await issues.print({ severity: "error" });
  process.exit(1);
});
