import chalk from "chalk";
import {
  argumentTokensNameId,
  type ParsedArgumentTokensNameId,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { addTokensToStore } from "@/services/token";

const summary = `Save tokens to the store`;
const description = `If a token already exists, it will be overwritten.

Save a token:
${chalk.dim("  $ ")}vaulty tokens save token1:s.gVg7...

Save multiple tokens:
${chalk.dim("  $ ")}vaulty tokens save token1:s.gVg7... token2:s.hTg7...

Save a token to a specific project:
${chalk.dim(
  "  $ ",
)}vaulty tokens save --cwd /path/to/directory -- token1:s.gVg7...`;

export const getSaveCommand = async () => {
  const command = getCommand({
    name: "save",
    summary,
    description,
  });

  command.addArgument(argumentTokensNameId);

  command.action<[ParsedArgumentTokensNameId, CommandOptions]>(
    async (tokensParsedArg, options) => {
      const { logger } = getLogger({ options });

      if (!Object.keys(tokensParsedArg).length) {
        logger.info(chalk.dim("No token to save"));
        return;
      }

      await addTokensToStore({ options, tokens: tokensParsedArg });
    },
  );

  return command;
};
