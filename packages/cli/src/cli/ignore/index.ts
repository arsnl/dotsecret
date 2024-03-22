import { getCommand } from "@/lib/cli";

export const getIgnoreCommand = async () => {
  const command = await getCommand({
    name: "ignore",
    summary: "Update the ignore files",
    description:
      "Updates the ignore files, such as .gitignore, to ensure that the rendered output files generated by dotsecret render are properly ignored by version control systems or other tools.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
