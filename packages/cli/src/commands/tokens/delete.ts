import chalk from "@/esm-only/chalk";
import {
  argumentTokensName,
  type ParsedArgumentTokensName,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getConfig } from "@/services/config";
import { getLogger } from "@/services/logger";
import { confirmOrAbort } from "@/services/prompt";
import { getTokens, removeTokensFromStore } from "@/services/token";

const summary = `Delete stored tokens`;
const description = `If no token is specified, all tokens will be deleted. This will not revoke the token, it will only remove it from the store.

Delete all tokens:
${chalk.dim("  $ ")}vaulty tokens delete

Delete some tokens:
${chalk.dim("  $ ")}vaulty tokens delete token1 token2

Delete some tokens of another project:
${chalk.dim(
  "  $ ",
)}vaulty tokens delete --cwd /path/to/directory -- token1 token2`;

export const getDeleteCommand = async () => {
  const command = getCommand({
    name: "delete",
    summary,
    description,
    options: {
      force: true,
    },
  });

  command.addArgument(argumentTokensName);

  command.action<[ParsedArgumentTokensName, CommandOptions]>(
    async (tokensArg, options) => {
      const { logger } = getLogger({ options });
      const { project } = await getConfig({ options });
      const tokens = await getTokens({ options, tokens: tokensArg });
      const tokenKeys = tokens.map((token) => token.key);

      if (!tokenKeys.length) {
        logger.info(chalk.dim("No tokens found"));
        return;
      }

      if (!options.force) {
        await confirmOrAbort(`${chalk.bold(
          `You are about to delete the following token${
            tokenKeys.length > 1 ? "s" : ""
          } from the store.`,
        )}

${tokenKeys.map((key) => chalk.cyan(key)).join(", ")}

${chalk.bold("From the following project.")}

${chalk.cyan(project)}`);
      }

      await removeTokensFromStore({ options, tokens: tokenKeys });
    },
  );

  return command;
};
