import chalk from "chalk";
import { getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getTokens } from "@/services/token";

const summary = `List stored tokens`;

export const getListCommand = async () => {
  const command = getCommand({
    name: "list",
    summary,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const tokens = await getTokens({ options });

    if (!tokens.length) {
      logger.log(chalk.dim("No tokens found"));
      return;
    }

    const keyPad = (str: string) => str.padStart(8, " ");

    tokens.forEach((token, index) => {
      logger.log(`─ ${chalk.bold(token.key)} `.padEnd(80, "─"));
      logger.log(`${keyPad("Value:")} ${chalk.green(token.value)}`);
      logger.log(
        `${keyPad("Expires:")} ${chalk.green(
          token?.metadata?.expire_time
            ? new Date(token?.metadata?.expire_time)
            : "n/a",
        )}`,
      );
      logger.log(
        `${keyPad("Source:")} ${chalk.green(
          token.fromStore ? "Store" : "Option",
        )}`,
      );

      if (index < tokens.length - 1) {
        logger.log();
      }
    });
  });

  return command;
};
