import winston from "winston";

export type LogLevel = keyof typeof LOG_LEVELS;

export const LOG_LEVELS = {
  cli: 0, // cli is not a valid level, but we use it to log everything when running the CLI
  error: 0,
  warn: 1,
  info: 2,
  debug: 2,
} as const;

export const LOG_LEVEL_DEFAULT: LogLevel = "info";

const transports = {
  console: new winston.transports.Console({ level: LOG_LEVEL_DEFAULT }),
};

const format = winston.format.combine(
  winston.format.printf(({ message }) => {
    const formattedMessage =
      typeof message === "object" ? JSON.stringify(message) : message;

    return formattedMessage;
  }),
);

export const setLogLevel = (level: LogLevel) => {
  transports.console.level = level;
};

export const logger = winston.createLogger({
  levels: LOG_LEVELS,
  format,
  transports: Object.values(transports),
}) as winston.Logger &
  Record<keyof typeof LOG_LEVELS, winston.LeveledLogMethod>;
