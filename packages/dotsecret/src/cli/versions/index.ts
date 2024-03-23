import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getVersionsCommand = async () => {
  const command = await getCommand({
    name: "versions",
    summary: "List version history",
    description:
      "Lists the version history of the secrets, showing when they were modified and by whom.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
