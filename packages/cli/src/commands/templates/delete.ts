import chalk from "chalk";
import {
  argumentTemplates,
  type ParsedArgumentTemplates,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getIssuesCollector } from "@/services/issue";
import { getLogger } from "@/services/logger";
import { deleteTemplateOutput, getTemplates } from "@/services/template";

const summary = `Delete template outputs`;
const description = `You can optionnaly specify glob patterns to filter the templates outputs to delete. If you do, note that you need to use single quotes around the glob patterns to avoid your shell to interpret them.

Delete all template outputs:
${chalk.dim("  $ ")}vaulty templates delete

Delete a specific template output:
${chalk.dim("  $ ")}vaulty templates delete '.env.vaulty'

Delete only the js and json template outputs:
${chalk.dim("  $ ")}vaulty templates delete '**/*.{js,json}.*'

Delete only the js and json template outputs except the ones in the src directory:
${chalk.dim("  $ ")}vaulty templates delete '**/*.{js,json}.* !src/**/*'`;

export const getDeleteCommand = async () => {
  const command = getCommand({
    name: "delete",
    summary,
    description,
    options: {
      dryRun: true,
    },
  });

  command.addArgument(argumentTemplates);

  command.action<[ParsedArgumentTemplates, CommandOptions]>(
    async (templatesArg, options) => {
      const { dryRun } = options;
      const { logger } = getLogger({ options });
      const templates = await getTemplates({
        options,
        templates: templatesArg,
      });
      const issuesCollector = getIssuesCollector();

      const templatesWithOutputs = templates.filter(
        ({ lastOutput }) => lastOutput !== null,
      );

      if (!templatesWithOutputs.length) {
        logger.info(chalk.dim("No outputs found"));
        return;
      }

      let qtyDeleted = 0;

      await Promise.all(
        templatesWithOutputs.map(async ({ template, output }) => {
          try {
            !dryRun && (await deleteTemplateOutput({ options, template }));
            qtyDeleted += 1;
            logger.debug(`Deleted ${output}`);
          } catch (error) {
            logger.debug(`Failed to delete ${output}`);
          }
        }),
      );

      qtyDeleted
        ? logger.info(
            `${chalk.green("✔")} ${qtyDeleted} output${
              qtyDeleted > 1 ? "s" : ""
            } deleted`,
          )
        : logger.info(chalk.dim("No outputs deleted"));

      const errorsCount = issuesCollector.get().counts.errors;
      errorsCount && logger.error();
      errorsCount && issuesCollector.print({ severity: "error" });
      errorsCount && process.exit(1);
    },
  );

  return command;
};
