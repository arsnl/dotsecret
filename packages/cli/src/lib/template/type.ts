import { type ConfigOptionExtend } from "@/lib/config";

export type TemplateOptions = ConfigOptionExtend & {
  /** The template file path. */
  file: string;
};

export type TemplatesOptions = ConfigOptionExtend & {
  /** A list of glob patterns to filter the templates. */
  globPatterns?: string[];
};

export type TemplateInfo = {
  /** The template file absolute path */
  template: string;
  /** The last time the template was updated. */
  lastUpdate: Date;
  /** The output file absolute path */
  output: string;
  /** The last time the output was written. */
  lastOutput?: Date;
};
