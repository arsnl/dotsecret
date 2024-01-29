/* eslint-disable no-console -- Only place in the CLI where the no-console should be accepted */
import { type CommandOptions } from "@/services/command";

export const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;

export const LOG_LEVEL_DEFAULT = LOG_LEVELS[2];

export type LogLevel = (typeof LOG_LEVELS)[number];

const shouldLog = (level: LogLevel, currentLevel: LogLevel) =>
  LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(currentLevel);

export const getLogger = ({ options }: { options?: CommandOptions } = {}) => {
  const level = options?.logLevel ?? LOG_LEVEL_DEFAULT;

  const logger = {
    // Used to bypass the log level check. Useful for messages that should always be printed.
    log: (...args: Parameters<typeof console.log>) => {
      console.log(...args);
    },
    error: (...args: Parameters<typeof console.error>) => {
      if (shouldLog("error", level)) {
        console.error(...args);
      }
    },
    warn: (...args: Parameters<typeof console.warn>) => {
      if (shouldLog("warn", level)) {
        console.warn(...args);
      }
    },
    info: (...args: Parameters<typeof console.info>) => {
      if (shouldLog("info", level)) {
        console.info(...args);
      }
    },
    debug: (...args: Parameters<typeof console.debug>) => {
      if (shouldLog("debug", level)) {
        console.debug(...args);
      }
    },
  };

  return { logger };
};
