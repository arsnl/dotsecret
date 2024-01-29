import { getCommand } from "@/services/command";
import { getFixCommand } from "./fix";
import { getReportCommand } from "./report";

const summary = `Interact with audit commands`;
const description = `The audit is a useful tool to check the validity of the project and automatically fix some issues.

Using this command, you can run an audit to report or fix issues.`;

export const getAuditCommand = async () => {
  const command = getCommand({
    name: "audit",
    summary,
    description,
  });

  command.addCommand(await getReportCommand());
  command.addCommand(await getFixCommand());

  return command;
};
