import { getCommand } from "@/services/command";
import { getCurrentCommand } from "./current";
import { getDeleteCommand } from "./delete";
import { getListCommand } from "./list";

const summary = `Interact with projects commands`;
const description = `A project is identified by the path to the closest configuration or package.json file in the current working directory or any of its parent directories.

Using this command, you can list, delete or show the current project.`;

export const getProjectsCommand = async () => {
  const command = getCommand({
    name: "projects",
    summary,
    description,
  });

  command.addCommand(await getListCommand());
  command.addCommand(await getDeleteCommand());
  command.addCommand(await getCurrentCommand());

  return command;
};
