import chalk from "@/esm-only/chalk";
import { getCommand } from "@/services/command";
import { getConfig } from "@/services/config";
import { getLogger } from "@/services/logger";
import {
  getProjectFromStore,
  removeProjectFromStore,
} from "@/services/project";
import { confirmOrAbort } from "@/services/prompt";

const summary = `Delete stored project`;
const description = `This command will remove a project settings from the store. This will not delete any file on the disk.`;

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
    const { project } = await getConfig({ options });
    const storedProject = await getProjectFromStore({ options });

    if (!storedProject) {
      logger.log(chalk.dim("The project is not stored"));
      return;
    }

    if (!options.force) {
      await confirmOrAbort(`${chalk.bold(
        "You are about to delete the following project from the store.",
      )}

${chalk.cyan(project)}`);
    }

    await removeProjectFromStore({ options });

    logger.info(`${chalk.green("✔")} Project deleted`);
  });

  return command;
};
