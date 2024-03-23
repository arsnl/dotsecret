import {
  type ArgumentGlobPatterns,
  argumentGlobPatterns,
  type CommandOptions,
  getCommand,
} from "@/lib/cli";
import { writeOutputs } from "@/lib/template";

export const getRenderCommand = async () => {
  const command = await getCommand({
    name: "render",
    summary: "Render the template files",
    description:
      "Processes template files, replacing placeholders with actual secrets and generating output files.",
    usages: [
      {
        title: "Render all template files",
        command: "dotsecret render",
      },
      {
        title: "Render a specific template file",
        command: "dotsecret render '.env.secret'",
      },
      {
        title: "Render only the js and json template files",
        command: "dotsecret render '**/*.{js,json}.*'",
      },
      {
        title:
          "Render only the js and json template files except the ones in src",
        command: "dotsecret render '**/*.{js,json}.* !src/**/*'",
      },
    ],
  });

  command.addArgument(argumentGlobPatterns.argOptional());

  command.action<[ArgumentGlobPatterns, CommandOptions]>(
    async (globPatterns, options) => {
      const config = { cwd: options.cwd, file: options.config };
      await writeOutputs({ globPatterns, config });
    },
  );

  return command;
};
