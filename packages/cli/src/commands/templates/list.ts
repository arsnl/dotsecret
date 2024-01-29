import chalk from "chalk";
import {
  argumentTemplates,
  type ParsedArgumentTemplates,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getTemplates } from "@/services/template";

const summary = `List template files`;
const description = `You can optionnaly specify glob patterns to filter the results. If you do, note that you need to use single quotes around the glob patterns to avoid your shell to interpret them.

List all template files:
${chalk.dim("  $ ")}vaulty templates list

List only the js and json template files:
${chalk.dim("  $ ")}vaulty templates list '**/*.{js,json}.*'

List only the js and json template files except the ones in the src directory:
${chalk.dim("  $ ")}vaulty templates list '**/*.{js,json}.* !src/**/*'`;

export const getListCommand = async () => {
  const command = getCommand({
    name: "list",
    summary,
    description,
  });

  command.addArgument(argumentTemplates);

  command.action<[ParsedArgumentTemplates, CommandOptions]>(
    async (templatesArg, options) => {
      const { logger } = getLogger({ options });
      const templates = await getTemplates({
        options,
        templates: templatesArg,
      });

      if (!templates.length) {
        logger.log(chalk.dim("No template found"));
        return;
      }

      logger.log(templates.map((template) => template.template).join("\n"));
    },
  );

  return command;
};
