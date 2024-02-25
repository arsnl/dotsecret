import chalk from "@/esm-only/chalk";
import { getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { confirmOrAbort } from "@/services/prompt";
import { deleteStore, getStore } from "@/services/store";

const summary = `Delete the store`;
const description = `Contrary to "vaulty store reset", this command deletes the store file and don't recreate it.`;

export const getDeleteCommand = async () => {
  const command = getCommand({
    name: "delete",
    summary,
    description,
    options: {
      force: true,
    },
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const store = await getStore({ options });

    if (!store.exists) {
      logger.log(chalk.dim("The store file doesn't exist"));
      return;
    }

    if (!options.force) {
      await confirmOrAbort(
        `${chalk.bold("You are about to delete the store.")}
        
This will delete the store file and all the data it contains.
This action is irreversible.`,
      );
    }

    await deleteStore({ options });

    logger.info(`${chalk.green("✔")} Store deleted`);
  });

  return command;
};
