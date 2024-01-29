import { getCommand } from "@/services/command";
import { getDeleteCommand } from "./delete";
import { getListCommand } from "./list";
import { getLookupCommand } from "./lookup";
import { getRenewCommand } from "./renew";
import { getSaveCommand } from "./save";

const summary = `Interact with tokens commands`;
const description = `The tokens are used to authenticate to the Vault servers your project needs to communicate with. Most of the project will only use one token and one Vault server, but you can have as many Vault servers and tokens as you want. For example, you can use different tokens to access different secrets in the same Vault. It all depends on your own needs.                                      
                                                                                
Tokens are stored in the store or can be provided via the "--tokens" option. If you provide a token via the "--tokens" option, Vaulty will not store it in the store and will not use the one in the store if there is one.

Using this command, you can list, save, look up, renew, and delete tokens.`;

export const getTokensCommand = async () => {
  const command = getCommand({
    name: "tokens",
    summary,
    description,
  });

  command.addCommand(await getListCommand());
  command.addCommand(await getSaveCommand());
  command.addCommand(await getLookupCommand());
  command.addCommand(await getRenewCommand());
  command.addCommand(await getDeleteCommand());

  return command;
};
