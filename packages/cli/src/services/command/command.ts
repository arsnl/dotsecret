import pkg from "@pkg";
import { Command } from "commander";
import boxen from "@/esm-only/boxen";
import chalk from "@/esm-only/chalk";
import * as argument from "./_argument";
import type * as Argument from "./_argument";

export { Argument, argument };

const BANNER = `${chalk.bold("Dotsecret")} — ${pkg.description}
  
Version: ${pkg.version}
`;

type CommandOptionsConfig = {
  /** Whether to display the --help option. */
  help?: boolean;
  /** Whether to display the --config option. */
  config?: boolean;
  /** Whether to display the --dry-run option. */
  dryRun?: boolean;
  /** Whether to display the --log-level option. */
  logLevel?: boolean;
  /** Whether to display the --force option. */
  force?: boolean;
  /** Whether to display the --cwd option. */
  cwd?: boolean;
  /** Whether to display the --tokens option. */
  tokens?: boolean;
};

export type CommandOptions<T = {}> = {
  /** The path to the configuration file. */
  config?: Argument.ParsedOptionConfig;
  /** Whether to show what would be done without actually doing it. */
  dryRun: Argument.ParsedOptionDryRun;
  /** The log level. */
  logLevel: Argument.ParsedOptionLogLevel;
  /** Whether to override safety checks and force operations to complete. */
  force: Argument.ParsedOptionForce;
  /** The current working directory. */
  cwd: Argument.ParsedOptionCwd;
  /** The tokens to use. */
  tokens: Argument.ParsedOptionTokensNameId;
} & T;

type CommandCommandsConfig = {
  /** Whether to add the help command. */
  help?: boolean;
};

type GetCommandOptions = {
  /** The name of the command. */
  name?: string;
  /** The summary of the command. */
  summary: string;
  /** The description of the command. */
  description?: string;
  /** Whether to display the banner. */
  banner?: boolean;
  /** The command commands */
  commands?: CommandCommandsConfig;
  /** The command options. */
  options?: CommandOptionsConfig;
};

const defaultCommandOptions: CommandOptionsConfig = {
  help: true,
  config: true,
  dryRun: false,
  logLevel: true,
  force: false,
  cwd: true,
  tokens: true,
};

const defaultCommandCommands: CommandCommandsConfig = {
  help: false,
};

export const getCommand = ({
  name,
  description,
  summary,
  banner = false,
  commands = {},
  options = {},
}: GetCommandOptions) => {
  const command = new Command(name) as Omit<Command, "action"> & {
    action: <T extends any[] = [CommandOptions, ...any[]]>(
      fn: (...args: T) => Promise<void>,
    ) => Command;
  };
  const commandCommands = { ...defaultCommandCommands, ...commands };
  const commandOptions = { ...defaultCommandOptions, ...options };

  banner && command.addHelpText("before", BANNER);
  command.summary(summary);
  description
    ? command.description(
        `Description:\n${boxen(`${summary}.\n\n${description}`, {
          padding: { left: 2 },
          borderStyle: "none",
          width: 80,
        })}`,
      )
    : command.description(`Description: ${summary}.`);

  // Let the command pass through global options to subcommands.
  command.enablePositionalOptions();
  command.passThroughOptions();

  // Allow unknown options to be passed to subcommands.
  command.allowUnknownOption();

  commandOptions.help &&
    command.helpOption("-h, --help", "Display help for command");

  commandOptions.config && command.addOption(argument.optionConfig);
  commandOptions.logLevel && command.addOption(argument.optionLogLevel);
  commandOptions.cwd && command.addOption(argument.optionCwd);
  commandOptions.force && command.addOption(argument.optionForce);
  commandOptions.dryRun && command.addOption(argument.optionDryRun);
  commandOptions.tokens && command.addOption(argument.optionTokensNameId);

  commandCommands.help
    ? command.helpCommand("help [command]", "Display help for a command")
    : command.helpCommand(false);

  return command;
};
