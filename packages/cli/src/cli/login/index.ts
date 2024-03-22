import { getCommand } from "@/lib/cli";

export const getLoginCommand = async () => {
  const command = await getCommand({
    name: "login",
    summary: "Log in",
    description:
      "Use this command to log in to the configured secrets manager.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
