import { cosmiconfig } from "cosmiconfig";
import nodePath from "node:path";
import { z } from "zod";
import { issues } from "@/lib/issue";
import { getAbsolutePath, isFileExists } from "@/lib/utils";

/** The dotsecret configuration. */
export const ConfigSchema = z
  .object({
    /** Weither or not to respect ignore patterns in .gitignore files that apply to the dotsecret files. */
    gitignore: z
      .boolean()
      .default(true)
      .describe(
        "Weither or not to respect ignore patterns in .gitignore files that apply to the dotsecret files.",
      ),
  })
  .strict()
  .describe("The dotsecret configuration.");

export type Config = z.input<typeof ConfigSchema>;

/** The processed dotsecret configuration. */
export const ConfigOuputSchema = ConfigSchema.extend({
  /** The current working directory. */
  cwd: z.string().describe("The current working directory."),
  /** The dotsecret configuration file path. */
  config: z.string().describe("The dotsecret configuration file path."),
  /** The root of the current project. */
  root: z.string().describe("The root of the current project."),
})
  .strict()
  .describe("The processed dotsecret configuration.");

export type ConfigOuput = z.output<typeof ConfigOuputSchema>;

export type GetConfigOptions = {
  /** The current working directory. */
  cwd?: string;
  /** The path to the configuration file. */
  file?: string;
};

/**
 * Get the dotsecret configuration.
 *
 * @param cwd The current working directory. Defaults to `process.cwd()`.
 * @param file The path to the configuration file to load. If not provided, the configuration will be searched.
 * @returns The dotsecret configuration if found, undefined otherwise.
 */
export const getConfig = async ({
  cwd = process.cwd(),
  file,
}: GetConfigOptions = {}) => {
  const moduleName = "secret";
  const explorer = cosmiconfig(moduleName, {
    searchPlaces: [
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.ts`,
      `.${moduleName}rc.mjs`,
      `.${moduleName}rc.cjs`,
    ],
    stopDir: nodePath.parse(cwd).root,
  });

  const fileExists = file && isFileExists(getAbsolutePath(file, cwd));
  if (file && !fileExists) {
    issues.add({
      message: `Configuration file not found: ${file}`,
    });

    return undefined;
  }

  const result = file
    ? await explorer.load(getAbsolutePath(file, cwd))
    : await explorer.search(cwd);
  const config = result?.filepath;

  if (!config) {
    issues.add({
      message: `No configuration file found`,
    });

    return undefined;
  }

  const parsed = ConfigOuputSchema.safeParse({
    ...result?.config,
    cwd,
    config,
    root: nodePath.parse(config).dir,
  });

  if (!parsed.success) {
    issues.add({
      message: `Invalid configuration file: ${config}\n${parsed?.error?.issues
        ?.map(
          (issue) =>
            `- ${issue.path.join(".") ? `${issue.path.join(".")}: ` : ""}${
              issue.message
            }`,
        )
        .join("\n")}`,
    });

    return undefined;
  }

  return {
    ...parsed?.data,
  };
};
