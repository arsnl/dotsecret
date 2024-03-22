import { getCommand } from "@/lib/cli";

export const getOpenCommand = async () => {
  const command = await getCommand({
    name: "open",
    summary: "Open secrets manager page",
    description:
      "Opens the web page or interface of the configured secrets manager for easy access.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
