import { getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getStore } from "@/services/store";

const summary = `Show the store source`;
const description = `The store file resides in your home directory. Executing this command will display the path to this file. If the output is "null", it indicates that the store file could not be located.`;

export const getSourceCommand = async () => {
  const command = getCommand({
    name: "source",
    summary,
    description,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const { source, exists } = await getStore({ options });

    logger.log(exists ? source : null);
  });

  return command;
};
