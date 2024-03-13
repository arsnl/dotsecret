import {
  argumentTemplates,
  type CommandOptions,
  getCommand,
  type ParsedArgumentTemplates,
} from "@/lib/command";
import { getConfig } from "@/lib/config";
import { getLogger } from "@/lib/logger";
import { getTemplates } from "@/lib/template";

const summary = `Render the template files`;
const description = `You can optionnaly specify glob patterns to filter the template files to render. If you do, note that you need to use single quotes around the glob patterns to avoid your shell to interpret them.`;
const usages = [
  { title: "Render all template files", command: "dotsecret render" },
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
    options: {
      dryRun: true,
    },
  });

  command.addArgument(argumentTemplates);

  command.action<[ParsedArgumentTemplates, CommandOptions]>(
    async (_templatesArg, options) => {
      // const { dryRun } = options;

      const templates = await getTemplates(options);

      console.log(templates);
    },
  );

  return command;
};
