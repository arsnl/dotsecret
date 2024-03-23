import { getCommand } from "@/lib/cli";

export const getCleanCommand = async () => {
  const command = await getCommand({
    name: "clean",
    summary: "Clean the rendered files",
    description:
      "Removes the rendered output files, restoring the project to its pre-render state.",
    usages: [],
  });

  command.action(async (options) => {
    const config = { cwd: options.cwd, file: options.config };
    console.log("To be implemented...");
  });

  return command;
};
