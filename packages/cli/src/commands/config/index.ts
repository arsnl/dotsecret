import { getCommand } from "@/services/command";
import { getDefaultCommand } from "./default";
import { getShowCommand } from "./show";
import { getSourceCommand } from "./source";

const summary = `Interact with config commands`;
const description = `The configuration is here you define your project secrets and their configuration, as well as some options to be used by Vaulty.

Vaulty use Cosmiconfig so there are multiple ways to declare your configuration. The configuration priority order is the following:

- a vaulty property in package.json
- a .vaultyrc file in JSON or YAML format
- a .vaultyrc.json file
- a .vaultyrc.yaml file
- a .vaultyrc.yml file
- a .vaultyrc.js file
- a .vaultyrc.ts file
- a .vaultyrc.mjs file
- a .vaultyrc.cjs file
- a vaultyrc file inside a .config subdirectory
- a vaultyrc.json file inside a .config subdirectory
- a vaultyrc.yaml file inside a .config subdirectory
- a vaultyrc.yml file inside a .config subdirectory
- a vaultyrc.js file inside a .config subdirectory
- a vaultyrc.ts file inside a .config subdirectory
- a vaultyrc.mjs file inside a .config subdirectory
- a vaultyrc.cjs file inside a .config subdirectory
- a vaulty.config.js file
- a vaulty.config.ts file
- a vaulty.config.mjs file
- a vaulty.config.cjs file

If no configuration is found in your project, the default configuration will be used.

Using this command, you can show a project configuration, the default configuration and the configuration source.`;

export const getConfigCommand = async () => {
  const command = getCommand({
    name: "config",
    summary,
    description,
  });

  command.addCommand(await getShowCommand());
  command.addCommand(await getDefaultCommand());
  command.addCommand(await getSourceCommand());

  return command;
};
