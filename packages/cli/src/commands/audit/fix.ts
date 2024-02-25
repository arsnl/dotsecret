import chalk from "@/esm-only/chalk";
import { runAudit } from "@/services/audit";
import { getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";

const summary = `Fix issues`;
const description = `Fix all issues that can be resolved. The fixable issues are the ones marked with a "⚒" icon in the audit report.`;

export const getFixCommand = async () => {
  const command = getCommand({
    name: "fix",
    summary,
    description,
  });

  command.action(async (options) => {
    const { issuesCollector } = await runAudit({ options });
    const { logger } = getLogger({ options });
    const { counts, issues } = issuesCollector.get();

    if (!counts.fixes) {
      logger.log(chalk.dim("Nothing to fix"));
      return;
    }

    await Promise.all(
      issues.map(async (issue) => {
        if (issue.fix) {
          await issue.fix();
        }
      }),
    );
  });

  return command;
};
