import { getCommand } from "@/services/command";
import { getConfig } from "@/services/config";
import { getLogger } from "@/services/logger";

const summary = `Show current project path`;

export const getCurrentCommand = async () => {
  const command = getCommand({
    name: "current",
    summary,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const { project } = await getConfig({ options });

    logger.log(project);
  });

  return command;
};
