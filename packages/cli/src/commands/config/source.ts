import { getCommand } from "@/services/command";
import { getConfig } from "@/services/config";
import { getLogger } from "@/services/logger";

const summary = `Show configuration source`;
const description = `Vaulty use Cosmiconfig so there are multiple files that can be used to configure Vaulty and their priority order is not always obvious. To know which file is used to configure Vaulty, you can use this command. 

If the value is "default", it means that the default configuration is used and no configuration file was found in the current project.`;

export const getSourceCommand = async () => {
  const command = getCommand({
    name: "source",
    summary,
    description,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const { source } = await getConfig({ options });

    logger.log(source);
  });

  return command;
};
