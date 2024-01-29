import { runAudit } from "@/services/audit";
import { getCommand } from "@/services/command";

const summary = `Report audit issues`;

export const getReportCommand = async () => {
  const command = getCommand({
    name: "report",
    summary,
  });

  command.action(async (options) => {
    const { issuesCollector } = await runAudit({ options });

    issuesCollector.print();
  });

  return command;
};
