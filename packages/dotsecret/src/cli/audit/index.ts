import { getCommand } from "@/lib/cli";
import { logger } from "@/lib/logger";

export const getAuditCommand = async () => {
  const command = await getCommand({
    name: "audit",
    summary: "Audit the project",
    description:
      "Checks the project for security vulnerabilities or issues related to secrets management.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    logger.cli("To be implemented...");
  });

  return command;
};
