import nodeFs from "node:fs";
import { getConfig, type GetConfigOptions } from "@/lib/config";
import { issues } from "@/lib/issue";
import {
  getAbsolutePath,
  getFileLastUpdate,
  isFileExists,
  isPathIgnoredByGit,
  isPathInGitRepository,
  isPathWriteable,
} from "@/lib/utils";
import { getTemplateData } from "./data";
import { getTemplateEngine } from "./engine";

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

export type GetTemplateInfoOptions = {
  /** The template file to get. */
  file: string;
  /** The configuration options */
  config?: GetConfigOptions;
};

/**
 * Get the template information
 *
 * @param options - The options to get the template information
 * @returns The template information if the template exists, undefined otherwise
 */
export const getTemplateInfo = async (
  options: GetTemplateInfoOptions,
): Promise<TemplateInfo | undefined> => {
  const config = await getConfig(options?.config);

  if (!config) {
    return undefined;
  }

  const template = options.file;
  const absoluteTemplate = getAbsolutePath(template, config.root);
  const lastUpdate = (await getFileLastUpdate(template))!;
  const output = template.replace(".secret", "");
  const absoluteOutput = getAbsolutePath(output, config.root);
  const lastOutput = await getFileLastUpdate(output);

  if (!isFileExists(absoluteTemplate)) {
    issues.add({
      message: `Template does not exist: ${template}`,
    });
    return undefined;
  }

  if (!(await isPathWriteable(absoluteOutput))) {
    issues.add({
      message: `Output is not writeable: ${output}`,
    });
    return undefined;
  }

  if (!lastOutput) {
    issues.add({
      message: `Output does not exist: ${output}`,
      severity: "warn",
      fix: async () => {
        await writeOutput(options);
      },
    });
  }

  if (!!lastOutput && lastOutput < lastUpdate) {
    issues.add({
      message: `Output is outdated: ${output}`,
      severity: "warn",
      fix: async () => {
        await writeOutput(options);
      },
    });
  }

  if (
    (await isPathInGitRepository(absoluteOutput)) &&
    !(await isPathIgnoredByGit(absoluteOutput))
  ) {
    issues.add({
      message: `Output is not gitignored: ${output}`,
    });
  }

  return {
    template: absoluteTemplate,
    lastUpdate,
    output: absoluteOutput,
    lastOutput,
  };
};

export type SearchTemplatesOptions = {
  /** The glob pattern of the templates to search. */
  globPattern?: string[];
  /** The configuration options */
  config?: GetConfigOptions;
};

/**
 * Search the templates
 *
 * @param options - The options to search the templates
 * @returns The templates information of the templates found
 */
export const searchTemplates = async (
  options: SearchTemplatesOptions = {},
): Promise<TemplateInfo[]> => {
  const { globby } = await import("globby");
  const { default: multimatch } = await import("multimatch");
  const { globPattern = ["**/*.secret"] } = options;
  const config = await getConfig(options?.config);

  if (!config) {
    return [];
  }

  const found = await globby(["**/*.secret", "!**/.secret"], {
    cwd: config.root,
    gitignore: config.gitignore,
    ignoreFiles: [
      ...(config.gitignore ? ["**/.gitignore"] : []),
      "**/.secretignore",
    ],
    dot: true,
  });

  const filtered = multimatch(found, globPattern, {
    dot: true,
  });

  const templates = await Promise.all(
    filtered.map(async (file) =>
      getTemplateInfo({ file, config: options?.config }),
    ),
  );

  return templates.filter((template): template is TemplateInfo => !!template);
};

export type WriteOutputOptions = {
  /** The template file to write. */
  file: string;
  /** The configuration options */
  config?: GetConfigOptions;
};

/**
 * Write the output file
 *
 * @param options - The options to write the output
 */
export const writeOutput = async (options: WriteOutputOptions) => {
  const info = await getTemplateInfo(options);
  const engine = await getTemplateEngine({ config: options?.config });
  const data = await getTemplateData(options);

  if (!info || !engine || !data) {
    return;
  }

  try {
    const renderedTemplate = engine.render(info.template, data);

    await nodeFs.promises.writeFile(info.output, renderedTemplate);
  } catch (error) {
    issues.error(error);
  }
};

export type DeleteOutputOptions = {
  /** The template file to delete. */
  file: string;
  /** The configuration options */
  config?: GetConfigOptions;
};

/**
 * Delete the output file
 *
 * @param options - The options to delete the output
 */
export const deleteOutput = async (options: DeleteOutputOptions) => {
  const info = await getTemplateInfo(options);

  if (!info?.lastOutput) {
    return;
  }

  try {
    await nodeFs.promises.rm(info.output);
  } catch (error) {
    issues.error(error);
  }
};
