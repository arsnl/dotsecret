import { Option } from "commander";
import { LOG_LEVEL_DEFAULT, LOG_LEVELS } from "@/lib/logger";
import { parserFileExists, parserPathExists } from "./parser";

export type OptionConfig = ReturnType<typeof parserFileExists>;

export const optionConfig = new Option(
  "-c, --config <path>",
  "Specify a configuration file",
).argParser(parserFileExists);

export type OptionLogLevel = (typeof LOG_LEVELS)[number];

export const optionLogLevel = new Option("-l, --log-level <level>", "Log level")
  .choices(LOG_LEVELS)
  .default(LOG_LEVEL_DEFAULT);

export type OptionCwd = ReturnType<typeof parserPathExists>;

export const optionCwd = new Option(
  "-d, --cwd <path>",
  "Current working directory",
)
  .default(process.cwd())
  .argParser(parserPathExists);

export type OptionForce = boolean;

export const optionForce = new Option(
  "-f, --force",
  "Override safety checks and force operations to complete",
).default(false);

export type OptionDryRun = boolean;

export const optionDryRun = new Option(
  "--dry-run",
  "Show what would be done without actually doing it",
).default(false);
