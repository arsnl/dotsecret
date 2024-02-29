import chalk from "@/esm-only/chalk";
import {
  type Argument,
  argument,
  type CommandOptions,
  getCommand,
} from "@/services/command";
import { getLogger } from "@/services/logger";

const summary = `Render the template files`;
const description = `You can optionnaly specify glob patterns to filter the template files to render. If you do, note that you need to use single quotes around the glob patterns to avoid your shell to interpret them.

Render all template files:
${chalk.dim("$")} dotsecret render

Render a specific template file:
${chalk.dim("$")} dotsecret render '.env.secret'

Render only the js and json template files:
${chalk.dim("$")} dotsecret render '**/*.{js,json}.*'

Render only the js and json template files except the ones in src:
${chalk.dim("$")} dotsecret render '**/*.{js,json}.* !src/**/*'`;

export const getRenderCommand = async () => {
  const command = getCommand({
    name: "render",
    summary,
    description,
    options: {
      dryRun: true,
    },
  });

  command.addArgument(argument.argumentTemplates);

  command.action<[Argument.ParsedArgumentTemplates, CommandOptions]>(
    async (_templatesArg, options) => {
      // const { dryRun } = options;
      const { logger } = getLogger({ options });

      logger.log("To be implemented");
      process.exit(0);
    },
  );

  return command;
};
