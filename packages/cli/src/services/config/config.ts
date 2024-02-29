import nodePath from "node:path";
import { z } from "zod";
import { findUp } from "@/esm-only/find-up";
import { type CommandOptions } from "@/services/command";
import { getIssuesCollector } from "@/services/issue";
import { readJsonFile } from "@/utils";

const GitIgnorechema = z.coerce
  .boolean()
  .describe(
    "Weither or not to respect ignore patterns in .gitignore files that apply to the dotsecret files.",
  );

const IgnoreFilesSchema = z
  .array(z.string())
  .describe(
    "Glob patterns to look for ignore files, which are then used to ignore dotsecret files.",
  );

/** The dotsecret configuration input. */
export const ConfigInputSchema = z
  .object({
    /** Weither or not to respect ignore patterns in .gitignore files that apply to the dotsecret files. */
    gitignore: GitIgnorechema.optional(),
    /** Glob patterns to look for ignore files, which are then used to ignore dotsecret files. */
    ignoreFiles: IgnoreFilesSchema.optional(),
  })
  .strict()
  .describe("The dotsecret configuration input");

export type ConfigInput = z.infer<typeof ConfigInputSchema>;

/** The dotsecret configuration. */
export const ConfigSchema = z
  .object({
    /** The current working directory. */
    cwd: z.string().describe("The current working directory."),
    /** The root path of the current project. */
    projectRoot: z.string().describe("The root path of the current project."),
    /** Weither or not to respect ignore patterns in .gitignore files that apply to the dotsecret files. */
    gitignore: GitIgnorechema.default(true),
    /** Glob patterns to look for ignore files, which are then used to ignore dotsecret files. */
    ignoreFiles: IgnoreFilesSchema.default([
      "**/.gitignore",
      "**/.secretignore",
    ]),
  })
  .strict()
  .describe("The dotsecret configuration.");

export type Config = z.infer<typeof ConfigSchema>;

export const getDefaultConfig = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<Config> => {
  const { cwd } = options;
  const configPath = await findUp(".secret.config", { cwd });
  const projectRoot = nodePath.parse(configPath || "").dir;

  return ConfigSchema.parse({ cwd, projectRoot });
};

export const getConfig = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<Config> => {
  const { cwd } = options;
  const defaultConfig = await getDefaultConfig({ options });
  const issuesCollector = getIssuesCollector({ scope: "config" });
  const { projectRoot } = defaultConfig;
  const configFilePath = nodePath.join(projectRoot, ".secret.config");

  if (!projectRoot) {
    throw issuesCollector
      .add({ message: `No project found from ${cwd}` })
      .error();
  }

  const result = await readJsonFile<ConfigInput>(configFilePath);

  if (result) {
    const parsed = ConfigSchema.safeParse({
      ...result,
      cwd,
      projectRoot,
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
