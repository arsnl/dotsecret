import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getInitCommand = async () => {
  const command = await getCommand({
    name: "init",
    summary: "Initialize project",
    description:
      "This command initializes dotsecret by creating necessary configuration files.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
