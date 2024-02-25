import chalk from "@/esm-only/chalk";
import { getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getStore } from "@/services/store";

const summary = `List stored projects`;
const description = `Return the list of projects stored in the store and print them to the console.`;

export const getListCommand = async () => {
  const command = getCommand({
    name: "list",
    summary,
    description,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const store = await getStore({ options });
    const projectsKeysInStore = Object.keys(store.data.projects);

    if (!projectsKeysInStore.length) {
      logger.log(chalk.dim("No project stored"));
      return;
    }

    projectsKeysInStore.forEach((projectKey) => {
      logger.log(projectKey);
    });
  });

  return command;
};
