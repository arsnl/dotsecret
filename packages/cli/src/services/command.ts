import pkg from "@pkg";
import boxen from "boxen";
import chalk from "chalk";
import { Command } from "commander";
import {
  optionConfig,
  optionCwd,
  optionDryRun,
  optionForce,
  optionLogLevel,
  optionTokensNameId,
  type ParsedOptionConfig,
  type ParsedOptionCwd,
  type ParsedOptionDryRun,
  type ParsedOptionForce,
  type ParsedOptionLogLevel,
  type ParsedOptionTokensNameId,
} from "@/services/argument";

const BANNER = `${chalk.bold("Vaulty")} — ${pkg.description}
  
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
  config?: ParsedOptionConfig;
  /** Whether to show what would be done without actually doing it. */
  dryRun: ParsedOptionDryRun;
  /** The log level. */
  logLevel: ParsedOptionLogLevel;
  /** Whether to override safety checks and force operations to complete. */
  force: ParsedOptionForce;
  /** The current working directory. */
  cwd: ParsedOptionCwd;
  /** The tokens to use. */
  tokens: ParsedOptionTokensNameId;
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
  command.passThroughOptions();

  // Allow unknown options to be passed to subcommands.
  command.allowUnknownOption();

  commandOptions.help &&
    command.helpOption("-h, --help", "Display help for command");

  commandOptions.config && command.addOption(optionConfig);
  commandOptions.logLevel && command.addOption(optionLogLevel);
  commandOptions.cwd && command.addOption(optionCwd);
  commandOptions.force && command.addOption(optionForce);
  commandOptions.dryRun && command.addOption(optionDryRun);
  commandOptions.tokens && command.addOption(optionTokensNameId);

  commandCommands.help
    ? command.addHelpCommand("help [command]", "Display help for a command")
    : command.addHelpCommand(false);

  return command;
};
