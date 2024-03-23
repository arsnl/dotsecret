import { Command } from "commander";
import pkg from "@/lib/package";
import {
  type OptionConfig,
  optionConfig,
  type OptionCwd,
  optionCwd,
  type OptionDryRun,
  optionDryRun,
  type OptionForce,
  optionForce,
  type OptionLogLevel,
  optionLogLevel,
} from "./option";

type Options = {
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
};

const DEFAULT_OPTIONS: Options = {
  help: true,
  config: true,
  dryRun: false,
  logLevel: true,
  force: false,
  cwd: true,
};

type Commands = {
  /** Whether to add the help command. */
  help?: boolean;
};

const DEFAULT_COMMANDS: Commands = {
  help: false,
};

export type CommandOptions<T = {}> = {
  /** The path to the configuration file. */
  config?: OptionConfig;
  /** Whether to show what would be done without actually doing it. */
  dryRun: OptionDryRun;
  /** The log level. */
  logLevel: OptionLogLevel;
  /** Whether to override safety checks and force operations to complete. */
  force: OptionForce;
  /** The current working directory. */
  cwd: OptionCwd;
} & T;

export type GetCommandOptions = {
  /** The name of the command. */
  name?: string;
  /** The summary of the command. */
  summary: string;
  /** The description of the command. */
  description?: string;
  /** The command usages. */
  usages?: { title: string; command: string }[];
  /** Whether to display the banner. */
  banner?: boolean;
  /** The command commands */
  commands?: Commands;
  /** The command options. */
  options?: Options;
};

export const getCommand = async ({
  name,
  description,
  usages,
  summary,
  banner = false,
  commands = {},
  options = {},
}: GetCommandOptions) => {
  const { default: boxen } = await import("boxen");
  const { default: chalk } = await import("chalk");

  const command = new Command(name) as Omit<Command, "action"> & {
    action: <T extends any[] = [CommandOptions, ...any[]]>(
      fn: (...args: T) => Promise<void>,
    ) => Command;
  };

  const mergedCommands = { ...DEFAULT_COMMANDS, ...commands };
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  banner &&
    command.addHelpText(
      "before",
      `${chalk.bold("Dotsecret")} — ${pkg.description}
  
Version: ${pkg.version}
  `,
    );

  const formatedUsages = [
    "",
    ...(usages?.map(
      (usage) => `${usage.title}\n${chalk.dim("$")} ${usage.command}`,
    ) ?? []),
  ].join("\n\n");

  command.summary(summary);
  description
    ? command.description(
        `Description:\n${boxen(
          `${summary}.\n\n${description}${formatedUsages}`,
          {
            padding: { left: 2 },
            borderStyle: "none",
            width: 120,
          },
        )}`,
      )
    : command.description(`Description: ${summary}.`);

  // Let the command pass through global options to subcommands.
  command.enablePositionalOptions();
  command.passThroughOptions();

  // Allow unknown options to be passed to subcommands.
  command.allowUnknownOption();

  mergedOptions.help &&
    command.helpOption("-h, --help", "Display help for command");

  mergedOptions.config && command.addOption(optionConfig);
  mergedOptions.logLevel && command.addOption(optionLogLevel);
  mergedOptions.cwd && command.addOption(optionCwd);
  mergedOptions.force && command.addOption(optionForce);
  mergedOptions.dryRun && command.addOption(optionDryRun);

  mergedCommands.help
    ? command.helpCommand("help [command]", "Display help for a command")
    : command.helpCommand(false);

  return command;
};
