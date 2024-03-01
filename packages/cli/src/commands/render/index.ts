import {
  argumentTemplates,
  type CommandOptions,
  getCommand,
  type ParsedArgumentTemplates,
} from "@/libs/command";
import { getLogger } from "@/libs/logger";
import chalk from "@/vendors/chalk";

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

  command.addArgument(argumentTemplates);

  command.action<[ParsedArgumentTemplates, CommandOptions]>(
    async (_templatesArg, options) => {
      // const { dryRun } = options;
      const { logger } = getLogger({ options });

      logger.log("To be implemented");
      process.exit(0);
    },
  );

  return command;
};
