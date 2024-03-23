import { getCommand } from "@/lib/cli";

export const getPullCommand = async () => {
  const command = await getCommand({
    name: "pull",
    summary: "Pull secrets securely",
    description:
      "Retrieves secrets securely from the configured secrets manager and stores them locally.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
