import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getLoginCommand = async () => {
  const command = await getCommand({
    name: "login",
    summary: "Log in",
    description:
      "Use this command to log in to the configured secrets manager.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
