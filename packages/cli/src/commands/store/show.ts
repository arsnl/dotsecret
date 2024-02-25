import chalk from "@/esm-only/chalk";
import colorJson from "@/esm-only/color-json";
import { getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getStore } from "@/services/store";

const summary = `Show the store contents`;

export const getShowCommand = async () => {
  const command = getCommand({
    name: "show",
    summary,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const store = await getStore({ options });

    if (!store.exists || !store.data) {
      logger.log(chalk.dim("The store is empty"));
      return;
    }

    logger.log(colorJson(store.data));
  });

  return command;
};
