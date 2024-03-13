import pkg from "@pkg";
import { Argument, Command, InvalidArgumentError, Option } from "commander";
import { LOG_LEVEL_DEFAULT, LOG_LEVELS } from "@/lib/logger";
import { getAbsolutePath, isFileExists, isPathExists } from "@/lib/utils";

export type ParsedPathExists = string;

export const argParserPathExists = (val: string) => {
  const absolutePath = getAbsolutePath(val);
  const pathExists = isPathExists(absolutePath);

  if (!pathExists) {
    throw new InvalidArgumentError(
      `The path "${absolutePath}" does not exist.`,
    );
  }

  return absolutePath;
};

export type ParsedFileExists = string;

export const argParserFileExists = (val: string) => {
  const absolutePath = getAbsolutePath(val);
  const fileExists = isFileExists(absolutePath);

  if (!fileExists) {
    throw new InvalidArgumentError(
      `The file "${absolutePath}" does not exist.`,
    );
  }

  return absolutePath;
};

export type ParsedGlobPatterns = string[];

export const argParserGlobPatterns = (val: string) =>
  val
    .split(" ")
    .map((pattern) => pattern.trim())
    .filter(Boolean);

export type ParsedOptionConfig = ParsedFileExists;

export const optionConfig = new Option(
  "-c, --config <path>",
  "Specify a configuration file",
).argParser(argParserFileExists);

export type ParsedOptionLogLevel = (typeof LOG_LEVELS)[number];

export const optionLogLevel = new Option("-l, --log-level <level>", "Log level")
  .choices(LOG_LEVELS)
  .default(LOG_LEVEL_DEFAULT);

export type ParsedOptionCwd = ParsedPathExists;

export const optionCwd = new Option(
  "-d, --cwd <path>",
  "Current working directory",
)
  .default(process.cwd())
  .argParser(argParserPathExists);

export type ParsedOptionForce = boolean;

export const optionForce = new Option(
  "-f, --force",
  "Override safety checks and force operations to complete",
).default(false);

export type ParsedOptionDryRun = boolean;

export const optionDryRun = new Option(
  "--dry-run",
  "Show what would be done without actually doing it",
).default(false);

export type ParsedArgumentTemplates = ParsedGlobPatterns;

export const argumentTemplates = new Argument(
  "[templates]",
  "Templates glob patterns",
).argParser(argParserGlobPatterns);

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
  config?: ParsedOptionConfig;
  /** Whether to show what would be done without actually doing it. */
  dryRun: ParsedOptionDryRun;
  /** The log level. */
  logLevel: ParsedOptionLogLevel;
  /** Whether to override safety checks and force operations to complete. */
  force: ParsedOptionForce;
  /** The current working directory. */
  cwd: ParsedOptionCwd;
} & T;

export const getCommand = async ({
  name,
  description,
  usages,
  summary,
  banner = false,
  commands = {},
  options = {},
}: {
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
}) => {
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
            width: 80,
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
