import nodeFs from "node:fs";
import { getConfig } from "@/lib/config";
import { issues } from "@/lib/issue";
import {
  getAbsolutePath,
  getFileLastUpdate,
  getRelativePath,
  isFileExists,
  isPathIgnoredByGit,
  isPathInGitRepository,
  isPathWriteable,
} from "@/lib/utils";
import { getTemplateData } from "./data";
import { getTemplateEngine } from "./engine";
import {
  type TemplateInfo,
  type TemplateOptions,
  type TemplatesOptions,
} from "./type";

/**
 * Search the templates
 *
 * @param options - The options to search the templates
 * @returns A list of paths of the templates found
 */
export const searchTemplates = async (options: TemplatesOptions = {}) => {
  const { globby } = await import("globby");
  const { default: multimatch } = await import("multimatch");
  const { globPatterns = ["**/*.secret"] } = options;
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
    absolute: true,
    dot: true,
  });

  const filtered = multimatch(found, globPatterns, {
    dot: true,
  });

  return filtered;
};

/**
 * Get the template information
 *
 * @param options - The options to get the template information
 * @returns The template information if the template exists, undefined otherwise
 */
export const getTemplateInfo = async (options: TemplateOptions) => {
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
      message: `Template does not exist: ${getRelativePath(template, config.root)}`,
    });
    return undefined;
  }

  if (!(await isPathWriteable(absoluteOutput))) {
    issues.add({
      message: `Output is not writeable: ${getRelativePath(output, config.root)}`,
    });
    return undefined;
  }

  if (!lastOutput) {
    issues.add({
      message: `Output does not exist: ${getRelativePath(output, config.root)}`,
      severity: "warn",
      fix: async () => {
        await writeOutput(options);
      },
    });
  }

  if (!!lastOutput && lastOutput < lastUpdate) {
    issues.add({
      message: `Output is outdated: ${getRelativePath(output, config.root)}`,
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
      message: `Output is not gitignored: ${getRelativePath(output, config.root)}`,
    });
  }

  const templateInfo: TemplateInfo = {
    template: absoluteTemplate,
    lastUpdate,
    output: absoluteOutput,
    lastOutput,
  };

  return templateInfo;
};

/**
 * Get the templates information
 *
 * @param options - The options to get the templates information
 * @returns The templates information
 */
export const getTemplatesInfo = async (options: TemplatesOptions = {}) => {
  const config = options?.config;
  const templates = await searchTemplates(options);

  const templatesInfo = await Promise.all(
    templates.map(async (file) => getTemplateInfo({ file, config })),
  );

  return templatesInfo.filter((info): info is TemplateInfo => !!info);
};

/**
 * Write the output file
 *
 * @param options - The options to write the output
 */
export const writeOutput = async (options: TemplateOptions) => {
  const info = await getTemplateInfo(options);
  const data = await getTemplateData(options);
  const engine = await getTemplateEngine({ config: options?.config });

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

/**
 * Write the output files
 *
 * @param options - The options to write the outputs
 */
export const writeOutputs = async (options: TemplatesOptions = {}) => {
  const templatesInfo = await getTemplatesInfo(options);

  await Promise.all(
    templatesInfo.map(async (info) => writeOutput({ file: info.template })),
  );
};

/**
 * Delete the output file
 *
 * @param options - The options to delete the output
 */
export const deleteOutput = async (options: TemplateOptions) => {
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

/**
 * Delete the output files
 *
 * @param options - The options to delete the outputs
 */
export const deleteOutputs = async (options: TemplatesOptions = {}) => {
  const templatesInfo = await getTemplatesInfo(options);

  await Promise.all(
    templatesInfo.map(async (info) => deleteOutput({ file: info.template })),
  );
};
