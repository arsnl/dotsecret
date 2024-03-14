import { type ArgumentTemplates, argumentTemplates } from "@/lib/cli/argument";
import { type CommandOptions, getCommand } from "@/lib/cli/command";
import { getConfig } from "@/lib/config";
import { getLogger } from "@/lib/logger";
import { readSecrets } from "@/lib/secret";
import { searchTemplates } from "@/lib/template/file";

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

  command.action<[ArgumentTemplates, CommandOptions]>(
    async (templatesArg, options) => {
      const configOptions = { cwd: options.cwd, file: options.config };
      // const { dryRun } = options;

      const templates = await searchTemplates({
        globPattern: templatesArg,
        config: configOptions,
      });
      const secrets = await readSecrets({ config: configOptions });

      console.log(secrets);
    },
  );

  return command;
};
