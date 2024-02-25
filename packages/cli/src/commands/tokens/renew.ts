import chalk from "@/esm-only/chalk";
import {
  argumentTokensName,
  type ParsedArgumentTokensName,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getTokens, renewTokens } from "@/services/token";

const summary = `Renew token leases`;
const description = `Renews a token's lease, extending the amount of time it can be used. If no token is specified, all tokens will be renewed.

Lease renewal will fail if the token don't have a lease, is not renewable, the token has already been revoked, or if the token has already reached its maximum TTL.

Renew all tokens:
${chalk.dim("  $ ")}vaulty tokens renew

Renew some tokens:
${chalk.dim("  $ ")}vaulty tokens renew token1 token2

Renew some tokens of another project:
${chalk.dim(
  "  $ ",
)}vaulty tokens renew --cwd /path/to/directory -- token1 token2`;

export const getRenewCommand = async () => {
  const command = getCommand({
    name: "renew",
    summary,
    description,
  });

  command.addArgument(argumentTokensName);

  command.action<[ParsedArgumentTokensName, CommandOptions]>(
    async (tokensArg, options) => {
      const { logger } = getLogger({ options });
      const tokensFound = await getTokens({ options, tokens: tokensArg });
      const nonRenewableTokens = tokensFound.filter(
        (token) => !token.metadata?.lease_id || !token.metadata?.renewable,
      );
      const renewableTokens = tokensFound.filter(
        (token) => token.metadata?.lease_id && token.metadata?.renewable,
      );

      if (nonRenewableTokens.length) {
        logger.warn(
          chalk.yellow.bold(
            nonRenewableTokens.length === 1
              ? `The following token is not renewable and will not be renewed:`
              : `The following tokens are not renewable and will not be renewed:`,
          ),
        );
        nonRenewableTokens.forEach(({ key }) =>
          logger.warn(chalk.yellow(`- ${key}`)),
        );
      }

      if (!renewableTokens.length) {
        !!nonRenewableTokens.length && logger.log();
        logger.info(chalk.dim("No tokens to renew"));
        return;
      }

      await renewTokens({ options, tokens: tokensArg });
    },
  );

  return command;
};
