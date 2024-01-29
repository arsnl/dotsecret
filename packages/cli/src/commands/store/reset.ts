import chalk from "chalk";
import { getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { confirmOrAbort } from "@/services/prompt";
import { resetStore } from "@/services/store";

const summary = `Reset the store`;
const description = `Delete the store file and recreate an empty one.`;

export const getResetCommand = async () => {
  const command = getCommand({
    name: "reset",
    summary,
    description,
    options: {
      force: true,
    },
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });

    if (!options.force) {
      await confirmOrAbort(`${chalk.bold("You are about to reset the store.")}

This will delete the store file and recreate an empty one.
This action is irreversible.`);
    }

    await resetStore({ options });

    logger.info(`${chalk.green("✔")} Store reset`);
  });

  return command;
};
