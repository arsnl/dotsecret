import { getCommand } from "@/lib/cli";

export const getInitCommand = async () => {
  const command = await getCommand({
    name: "init",
    summary: "Initialize project",
    description:
      "This command initializes dotsecret by creating necessary configuration files.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
