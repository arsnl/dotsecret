import chalk from "chalk";
import { getCommand } from "@/services/command";
import { getDeleteCommand } from "./delete";
import { getListCommand } from "./list";
import { getWriteCommand } from "./write";

const summary = `Interact with templates commands`;
const description = `The templates are the files that are used to generate the outputs. They can be of any format and placed anywhere in your project, but they must use the ".vaulty" extension or the extension you specified in the project configuration.

For example, if you have a template named ".env.vaulty" at the root of your project containing the following content:

${chalk.dim("  ")}{{ secrets.mySecret | keyValue }}

When you run the command "vaulty templates write", Vaulty will generate a file named ".env" at the same level as the template file, so the root of your project, containing all the values of the secret named "mySecret", but converted to key-value pairs to be compatible with the ".env" format.

Using this command, you can list template files and write or delete template outputs.`;

export const getTemplatesCommand = async () => {
  const command = getCommand({
    name: "templates",
    summary,
    description,
  });

  command.addCommand(await getListCommand());
  command.addCommand(await getWriteCommand());
  command.addCommand(await getDeleteCommand());

  return command;
};
