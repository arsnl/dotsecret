import pkg from "@pkg";
import { Argument, Command, InvalidArgumentError, Option } from "commander";
import { getAbsolutePath, isFileExists, isPathExists } from "@/libs/fs";
import { LOG_LEVEL_DEFAULT, LOG_LEVELS } from "@/libs/logger";
import boxen from "@/vendors/boxen";
import chalk from "@/vendors/chalk";

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

const BANNER = `${chalk.bold("Dotsecret")} — ${pkg.description}
  
Version: ${pkg.version}
`;

export type CommandOptions<T = {}> = {
  /** Whether to show what would be done without actually doing it. */
  dryRun: ParsedOptionDryRun;
  /** The log level. */
  logLevel: ParsedOptionLogLevel;
  /** Whether to override safety checks and force operations to complete. */
  force: ParsedOptionForce;
  /** The current working directory. */
  cwd: ParsedOptionCwd;
} & T;

export const getCommand = ({
  name,
  description,
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
  /** Whether to display the banner. */
  banner?: boolean;
  /** The command commands */
  commands?: Commands;
  /** The command options. */
  options?: Options;
}) => {
  const command = new Command(name) as Omit<Command, "action"> & {
    action: <T extends any[] = [CommandOptions, ...any[]]>(
      fn: (...args: T) => Promise<void>,
    ) => Command;
  };
  const mergedCommands = { ...DEFAULT_COMMANDS, ...commands };
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

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

  mergedOptions.help &&
    command.helpOption("-h, --help", "Display help for command");

  mergedOptions.logLevel && command.addOption(optionLogLevel);
  mergedOptions.cwd && command.addOption(optionCwd);
  mergedOptions.force && command.addOption(optionForce);
  mergedOptions.dryRun && command.addOption(optionDryRun);

  mergedCommands.help
    ? command.helpCommand("help [command]", "Display help for a command")
    : command.helpCommand(false);

  return command;
};
