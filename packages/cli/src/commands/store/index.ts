import { getCommand } from "@/services/command";
import { getDeleteCommand } from "./delete";
import { getResetCommand } from "./reset";
import { getShowCommand } from "./show";
import { getSourceCommand } from "./source";

const summary = `Interact with store commands`;
const description = `The store is used to save informations that cannot be stored in the projects configuration for security reasons, informations that are not relevant to the project configuration or informations that can be shared between different projects on your system.

For example, the tokens are saved in the store since they are sensitive and should not be saved on your project. But also because they can be shared between projects. Imagine you have two projects that communicate with the same Vault secrets. If you update the token on project A, you would like project B to use the new updated token and not the expired or revoked one.

Like for the Vault CLI, the store mode is 600. That means that only you can read and write to it.

Using this command, you can show, delete or reset the store.`;

export const getStoreCommand = async () => {
  const command = getCommand({
    name: "store",
    summary,
    description,
  });

  command.addCommand(await getShowCommand());
  command.addCommand(await getDeleteCommand());
  command.addCommand(await getResetCommand());
  command.addCommand(await getSourceCommand());

  return command;
};
