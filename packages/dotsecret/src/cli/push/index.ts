import { getCommand } from "@/lib/cli";

export const getPushCommand = async () => {
  const command = await getCommand({
    name: "push",
    summary: "Push secrets securely",
    description:
      "Sends locally edited secrets securely back to the configured secrets manage",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
