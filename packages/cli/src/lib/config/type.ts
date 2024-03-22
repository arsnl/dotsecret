import type { z } from "zod";
import type { ConfigOuputSchema, ConfigSchema } from "./schema";

export type Config = z.input<typeof ConfigSchema>;

export type ConfigOuput = z.output<typeof ConfigOuputSchema>;

export type ConfigOption = {
  /** The current working directory. */
  cwd?: string;
  /** The path to the configuration file. */
  file?: string;
};

export type ConfigOptionExtend = {
  /** The configuration options */
  config?: ConfigOption;
};
