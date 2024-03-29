import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getRenewCommand = async () => {
  const command = await getCommand({
    name: "renew",
    summary: "Renew the current session",
    description:
      "Renews the current user session from the configured secrets manager, extending its duration.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
