import { Argument, InvalidArgumentError, Option } from "commander";
import { LOG_LEVEL_DEFAULT, LOG_LEVELS } from "@/services/logger";
import { getAbsolutePath, isFileExists, isPathExists } from "@/utils";

export type ParsedTokensNameId = Record<string, string>;

export const argParserTokensNameId = (
  val: string,
  acc: ParsedTokensNameId = {},
) => {
  const name = val.split(":")[0].trim();
  const id = val.split(":").slice(1).join(":").trim();

  if (!name) {
    throw new InvalidArgumentError("Missing token name.");
  }

  if (!id) {
    throw new InvalidArgumentError("Missing token id.");
  }

  return { ...acc, [name]: id };
};

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

export type ParsedOptionTokensNameId = ParsedTokensNameId;

export const optionTokensNameId = new Option(
  "--tokens <name:id...>",
  "Tokens name and id to use",
).argParser(argParserTokensNameId);

export type ParsedArgumentTokensNameId = ParsedTokensNameId;

export const argumentTokensNameId = new Argument(
  "<name:id...>",
  "Tokens name and id",
).argParser(argParserTokensNameId);

export type ParsedArgumentTokensName = string[];

export const argumentTokensName = new Argument("[tokens...]", "Tokens names");

export type ParsedArgumentSecrets = string[];

export const argumentSecrets = new Argument("[secrets...]", "Secrets names");

export type ParsedArgumentTemplates = ParsedGlobPatterns;

export const argumentTemplates = new Argument(
  "[templates]",
  "Templates glob patterns",
).argParser(argParserGlobPatterns);
