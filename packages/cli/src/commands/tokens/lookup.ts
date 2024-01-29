import chalk from "chalk";
import colorJson from "color-json";
import {
  argumentTokensName,
  type ParsedArgumentTokensName,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getTokens } from "@/services/token";

const summary = `Show information for stored tokens`;
const description = `If no token is specified, display the information of all tokens of the project.

Display the information of all tokens:
${chalk.dim("  $ ")}vaulty tokens lookup

Display the information of some tokens:
${chalk.dim("  $ ")}vaulty tokens lookup token1 token2

Display the information of some tokens of another project:
${chalk.dim(
  "  $ ",
)}vaulty tokens lookup --cwd /path/to/directory -- token1 token2`;

export const getLookupCommand = async () => {
  const command = getCommand({
    name: "lookup",
    summary,
    description,
  });

  command.addArgument(argumentTokensName);

  command.action<[ParsedArgumentTokensName, CommandOptions]>(
    async (tokensArg, options) => {
      const { logger } = getLogger({ options });
      const tokens = await getTokens({ options, tokens: tokensArg });

      if (!tokens.length) {
        logger.info(chalk.dim("No tokens found"));
        return;
      }

      tokens.forEach((token, index) => {
        logger.log(`─ ${chalk.bold(token.key)} `.padEnd(80, "─"));
        logger.log(
          token.metadata
            ? colorJson(token.metadata)
            : chalk.dim("No metadata found"),
        );

        if (index < tokens.length - 1) {
          logger.log();
        }
      });
    },
  );

  return command;
};
