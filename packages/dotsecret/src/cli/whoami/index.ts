import { getCommand } from "@/lib/cli";

export const getWhoamiCommand = async () => {
  const command = await getCommand({
    name: "whoami",
    summary: "Display the current logged in user",
    description:
      "Shows the username or identifier of the currently logged-in user on the configured secrets manager.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
