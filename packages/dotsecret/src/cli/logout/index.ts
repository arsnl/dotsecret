import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getLogoutCommand = async () => {
  const command = await getCommand({
    name: "logout",
    summary: "Log out",
    description:
      "Logs out the current user from the configured secrets manager, ending the session and removing stored credentials.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
