import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getFixCommand = async () => {
  const command = await getCommand({
    name: "fix",
    summary: "Fix audit issues if possible",
    description:
      "Attempts to automatically fix any security issues detected during the audit process.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
