import chalk from "@/esm-only/chalk";
import { getCommand } from "@/services/command";
import { getShowCommand } from "./show";

const summary = `Interact with secrets commands`;
const description = `A secret is identified by the name of the key specified in your configuration that identify a Vault secret configuration.

For example, if you have the following configuration:

${chalk.dim("  ")}{
${chalk.dim("  ")}  secrets: {
${chalk.dim("  ")}    "mySecret": {
${chalk.dim("  ")}      address: "http://localhost:8200",
${chalk.dim("  ")}      path: "secret/my-secret",
${chalk.dim("  ")}      token: "main-token"
${chalk.dim("  ")}    }
${chalk.dim("  ")}  }
${chalk.dim("  ")}}

You gonna have a secret named "mySecret" and his values will be the secrets object located at "secret/my-secret" on the Vault server "http://localhost:8200".

Using this command, you can show the secrets.`;

export const getSecretsCommand = async () => {
  const command = getCommand({
    name: "secrets",
    summary,
    description,
  });

  command.addCommand(await getShowCommand());

  return command;
};
