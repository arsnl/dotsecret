import colorJson from "@/esm-only/color-json";
import { getCommand } from "@/services/command";
import { getConfig } from "@/services/config";
import { getLogger } from "@/services/logger";

const summary = `Show project configuration`;
const description = `This command will show the actual configuration used by Vaulty. It is the result of the merge between the default configuration and the configuration of the current project.`;

export const getShowCommand = async () => {
  const command = getCommand({
    name: "show",
    summary,
    description,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const config = await getConfig({ options });

    logger.log(colorJson(config));
  });

  return command;
};
