import chalk from "chalk";
import colorJson from "color-json";
import {
  argumentSecrets,
  type ParsedArgumentSecrets,
} from "@/services/argument";
import { type CommandOptions, getCommand } from "@/services/command";
import { getLogger } from "@/services/logger";
import { getSecrets } from "@/services/secret";

const summary = `Show values of secrets`;
const description = `If no secrets are specified, display the values of all secrets of the project.

Show all secrets:
${chalk.dim("  $ ")}vaulty secrets show

Show some secrets:
${chalk.dim("  $ ")}vaulty secrets show secret1 secret2

Show some secrets of another project:
${chalk.dim(
  "  $ ",
)}vaulty secrets show --cwd /path/to/directory -- secret1 secret2`;

export const getShowCommand = async () => {
  const command = getCommand({
    name: "show",
    summary,
    description,
  });

  command.addArgument(argumentSecrets);

  command.action<[ParsedArgumentSecrets, CommandOptions]>(
    async (secretsArg, options) => {
      const { logger } = getLogger({ options });
      const secrets = await getSecrets({ options });

      const filteredSecrets = secretsArg.length
        ? secrets.filter((secret) => secretsArg.includes(secret.key))
        : secrets;

      if (!filteredSecrets.length) {
        logger.log(chalk.dim("No secrets found"));
        return;
      }

      filteredSecrets.forEach((secret, index) => {
        logger.log(`─ ${chalk.bold(secret.key)} `.padEnd(80, "─"));
        logger.log(colorJson(secret.data));

        if (index < filteredSecrets.length - 1) {
          logger.log();
        }
      });
    },
  );

  return command;
};
