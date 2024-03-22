import {
  type ArgumentGlobPatterns,
  argumentGlobPatterns,
  type CommandOptions,
  getCommand,
} from "@/lib/cli";
import { writeOutputs } from "@/lib/template";

const summary = "Render the template files";
const description =
  "You can optionnaly specify glob patterns to filter the template files to render. If you do, note that you need to use single quotes around the glob patterns to avoid your shell to interpret them.";
const usages = [
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
    title: "Render only the js and json template files except the ones in src",
    command: "dotsecret render '**/*.{js,json}.* !src/**/*'",
  },
];

export const getRenderCommand = async () => {
  const command = await getCommand({
    name: "render",
    summary,
    description,
    usages,
  });

  command.addArgument(argumentGlobPatterns.argOptional());

  command.action<[ArgumentGlobPatterns, CommandOptions]>(
    async (globPatterns, options) => {
      const configOptions = { cwd: options.cwd, file: options.config };

      await writeOutputs({
        globPatterns,
        config: configOptions,
      });
    },
  );

  return command;
};
