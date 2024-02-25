import { cosmiconfig } from "cosmiconfig";
import { chain } from "lodash";
import nodePath from "node:path";
import { z } from "zod";
import { findUp } from "@/esm-only/find-up";
import { type CommandOptions } from "@/services/command";
import { getIssuesCollector } from "@/services/issue";

const UrlSchema = z
  .string()
  .refine(
    (data) => {
      try {
        const urlObject = new URL(data);
        return !!urlObject.toString();
      } catch {
        return false;
      }
    },
    {
      message: "Invalid URL format",
    },
  )
  .transform((data: string) => {
    try {
      const urlObject = new URL(data);
      return urlObject.toString();
    } catch (error) {
      throw new Error("Invalid URL format");
    }
  });

const ExtensionSchema = z
  .string()
  .transform((value) =>
    chain(value)
      .replace(/\s/g, "")
      .thru((v) => (v.startsWith(".") ? v : `.${v}`))
      .toLower()
      .value(),
  )
  .refine((value: string) => value.match(/^\.?[a-z0-9\-_]+$/i), {
    message: "The extension name must be a valid file extension.",
  })
  .describe("The extension name of the Vaulty files.");

const GitIgnorechema = z.coerce
  .boolean()
  .describe(
    "Weither or not to respect ignore patterns in .gitignore files that apply to the Vaulty files.",
  );

const IgnoreFilesSchema = z
  .array(z.string())
  .describe(
    "Glob patterns to look for ignore files, which are then used to ignore Vaulty files.",
  );

const SecretSchema = z
  .object({
    /** The Vault address. */
    address: UrlSchema.describe("The Vault address."),
    /** The namespace in the Vault where the secret is stored */
    namespace: z
      .string()
      .optional()
      .describe("The namespace in the Vault where the secret is stored"),
    /** The secret path. */
    path: z.string().describe("The secret path."),
    /** The token key to use. */
    token: z.string().describe("The token key to use."),
  })
  .strict()
  .describe("A secret configuration.");

const SecretsSchema = z
  .record(SecretSchema)
  .describe("The secrets configuration.");

const SourceSchema = z.string().describe("The path to the configuration file.");

/** The Vaulty configuration input. */
export const ConfigInputSchema = z
  .object({
    /** The extension of the Vaulty files. */
    extension: ExtensionSchema.optional(),
    /** Weither or not to respect ignore patterns in .gitignore files that apply to the Vaulty files. */
    gitignore: GitIgnorechema.optional(),
    /** Glob patterns to look for ignore files, which are then used to ignore Vaulty files. */
    ignoreFiles: IgnoreFilesSchema.optional(),
    /** The secrets configuration. */
    secrets: SecretsSchema.optional(),
  })
  .strict()
  .describe("The Vaulty configuration input");

export type ConfigInput = z.infer<typeof ConfigInputSchema>;

/** The Vaulty configuration. */
export const ConfigSchema = z
  .object({
    /** The current working directory. */
    cwd: z.string().describe("The current working directory."),
    /** The current project. */
    project: z.string().describe("The current project."),
    /** The extension of the Vaulty files. */
    extension: ExtensionSchema.default(".vaulty"),
    /** Weither or not to respect ignore patterns in .gitignore files that apply to the Vaulty files. */
    gitignore: GitIgnorechema.default(true),
    /** Glob patterns to look for ignore files, which are then used to ignore Vaulty files. */
    ignoreFiles: IgnoreFilesSchema.default([
      "**/.gitignore",
      "**/.vaultyignore",
    ]),
    /** The secrets configuration. */
    secrets: SecretsSchema.default({}),
    /** The path to the configuration file. */
    source: SourceSchema.default("default"),
  })
  .strict()
  .describe("The Vaulty configuration.");

export type Config = z.infer<typeof ConfigSchema>;

export const getDefaultConfig = async ({
  options,
  configPath,
}: {
  options: CommandOptions;
  configPath?: string;
}): Promise<Config> => {
  const { cwd } = options;
  const pkgPath = await findUp("package.json", { cwd });
  const project = nodePath.parse(configPath || pkgPath || "").dir;

  return ConfigSchema.parse({ cwd, project, source: configPath });
};

export const getConfig = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<Config> => {
  const explorer = cosmiconfig("vaulty");
  const { cwd } = options;

  const result = options.config
    ? await explorer.load(options.config)
    : await explorer.search(cwd);

  const configPath = result?.filepath;
  const defaultConfig = await getDefaultConfig({ options, configPath });
  const issuesCollector = getIssuesCollector({
    scope: "config",
    source: defaultConfig.source,
  });
  const { project } = defaultConfig;

  if (!project) {
    throw issuesCollector
      .add({ message: `No project found from ${cwd}` })
      .error();
  }

  if (result) {
    const parsed = ConfigSchema.safeParse({
      ...result.config,
      cwd,
      project,
      source: configPath,
    });
    const config = parsed.success ? parsed?.data : defaultConfig;

    if (!parsed.success) {
      throw issuesCollector
        .add({
          message: `Invalid configuration file\n${parsed?.error?.issues
            ?.map(
              (issue) =>
                `- ${issue.path.join(".") ? `${issue.path.join(".")}: ` : ""}${
                  issue.message
                }`,
            )
            .join("\n")}`,
        })
        .error();
    }

    return {
      ...config,
    };
  }

  return defaultConfig;
};
