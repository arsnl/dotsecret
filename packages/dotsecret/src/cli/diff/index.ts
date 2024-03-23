import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getDiffCommand = async () => {
  const command = await getCommand({
    name: "diff",
    summary: "Show differences between versions",
    description:
      "Displays the differences between different versions of the secrets for comparison.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
