import chalk from "@/esm-only/chalk";
import {
  argumentTemplates,
  type ParsedArgumentTemplates,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getIssuesCollector } from "@/services/issue";
import { getLogger } from "@/services/logger";
import { getTemplates, writeTemplateOutput } from "@/services/template";

const summary = `Write template outputs`;
const description = `You can optionnaly specify glob patterns to filter the template outputs to write. If you do, note that you need to use single quotes around the glob patterns to avoid your shell to interpret them.

Write all template outputs:
${chalk.dim("  $ ")}vaulty templates write

Write a specific template output:
${chalk.dim("  $ ")}vaulty templates write '.env.vaulty'

Write only the js and json template outputs:
${chalk.dim("  $ ")}vaulty templates write '**/*.{js,json}.*'

Write only the js and json template outputs except the ones in the src directory:
${chalk.dim("  $ ")}vaulty templates write '**/*.{js,json}.* !src/**/*'

Write only the js and json template outputs using tokens not saved in the store:
${chalk.dim(
  "  $ ",
)}vaulty templates write --tokens token1:s.gVg7... -- '**/*.{js,json}.*'`;

export const getWriteCommand = async () => {
  const command = getCommand({
    name: "write",
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

      if (!templates.length) {
        logger.info(chalk.dim("No templates found"));
        return;
      }

      let qtyWritten = 0;

      await Promise.all(
        templates.map(async ({ template, output }) => {
          try {
            !dryRun && (await writeTemplateOutput({ options, template }));
            qtyWritten += 1;
            logger.debug(`Wrote ${output}`);
          } catch {
            logger.debug(`Failed to write ${output}`);
          }
        }),
      );

      qtyWritten
        ? logger.info(
            `${chalk.green("✔")} ${qtyWritten} output${
              qtyWritten > 1 ? "s" : ""
            } written`,
          )
        : logger.info(chalk.dim("No outputs written"));

      const errorsCount = issuesCollector.get().counts.errors;
      errorsCount && logger.error();
      errorsCount && issuesCollector.print({ severity: "error" });
      errorsCount && process.exit(1);
    },
  );

  return command;
};
