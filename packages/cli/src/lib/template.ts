import dayjs from "dayjs";
import yaml from "js-yaml";
import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodePath from "node:path";
import nunjucks from "nunjucks";
import { getConfig, type GetConfigOptions } from "@/lib/config";
import { issues } from "@/lib/issue";
import { readSecrets } from "@/lib/secret";
import {
  getFileLastUpdate,
  isFileExists,
  isPathIgnoredByGit,
  isPathInGitRepository,
  isPathWriteable,
} from "@/lib/utils";

let GLOBAL_ENGINE: nunjucks.Environment;
let GLOBAL_DATA: any;

/**
 * Encodes a text string as a valid component of a Uniform Resource Identifier (URI)
 */
const filterEncodeURIComponent = (val: string) => encodeURIComponent(val);

/**
 * Gets the unencoded version of an encoded component of a Uniform Resource Identifier (URI).
 */
const filterDecodeURIComponent = (val: string) => decodeURIComponent(val);

/**
 * Encode a string to base64
 */
const filterBase64encode = (val: string) =>
  Buffer.from(val, "utf8").toString("base64");

/**
 * Decode a base64 string
 */
const filterBase64decode = (val: string) =>
  Buffer.from(val, "base64").toString("utf8");

/**
 * Hashes a string using the specified algorithm.
 */
const filterHash = (val: string, algorithm: string = "sha256") => {
  const hash = nodeCrypto.createHash(algorithm);
  hash.update(val);
  return hash.digest("hex");
};

/**
 * Encrypt a string using the specified algorithm.
 */
const filterEncrypt = (
  val: string,
  {
    secret = "",
    iv = "0123456789abcdef0123456789abcdef",
    algorithm = "aes-256-cbc",
  }: { secret?: string; iv?: string; algorithm?: string } = {},
) => {
  const cipher = nodeCrypto.createCipheriv(
    algorithm,
    nodeCrypto.createHash("sha256").update(secret).digest(),
    Buffer.from(iv, "hex"),
  );
  let encrypted = cipher.update(val, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

/**
 * Decrypt a string using the specified algorithm.
 */
const filterDecrypt = (
  val: string,
  {
    secret = "",
    iv = "0123456789abcdef0123456789abcdef",
    algorithm = "aes-256-cbc",
  }: { secret?: string; iv?: string; algorithm?: string } = {},
) => {
  const decipher = nodeCrypto.createDecipheriv(
    algorithm,
    nodeCrypto.createHash("sha256").update(secret).digest(),
    Buffer.from(iv, "hex"),
  );
  let decrypted = decipher.update(val, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * Get the formatted date according to the string of tokens passed in.
 */
const filterFormatDate = (
  val: string | number | Date,
  format: string = "YYYY-MM-DD HH:mm:ss",
) => dayjs(val).format(format);

/**
 * Converts a JavaScript value to a JSON string.
 */
const filterJson = (val: any, indent = 2) => JSON.stringify(val, null, indent);

/**
 * Convert a JSON to key=value
 */
const filterKeyValue = (val: object) =>
  Object.entries(val)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

/**
 * Converts a JSON to YAML.
 */
const filterYaml = (val: any) => yaml.dump(val);

export type Template = {
  /** The template path in the project. */
  template: string;
  /** The absolute template path */
  templatePath: string;
  /** The last time the template was updated. */
  lastUpdate: Date;
  /** The output path in the project. */
  output: string;
  /** The absolute output path */
  outputPath: string;
  /** The last time the output was written. */
  lastOutput?: Date;
};

export type GetTemplateOptions = GetConfigOptions & {
  /** The template file to get. */
  templateFile: string;
};

export const getTemplate = async (
  options: GetTemplateOptions,
): Promise<Template | undefined> => {
  const config = await getConfig(options);

  if (!config) {
    return undefined;
  }

  const output = options.templateFile.replace(".secret", "");
  const templatePath = nodePath.join(config.root, options.templateFile);
  const templateExists = await isFileExists(templatePath);
  const outputPath = nodePath.join(config.root, output);
  const lastUpdate = (await getFileLastUpdate(templatePath)) || new Date();
  const lastOutput = await getFileLastUpdate(outputPath);
  const hasWriteAccess = await isPathWriteable(outputPath);
  const isInGitRepository = await isPathInGitRepository(outputPath);
  const isGitIgnored = await isPathIgnoredByGit(outputPath);

  if (!templateExists) {
    issues.add({
      message: `Template does not exist: ${options.templateFile}`,
    });
    return undefined;
  }

  if (!hasWriteAccess) {
    issues.add({
      message: `Output is not writeable: ${outputPath}`,
    });
    return undefined;
  }

  if (!lastOutput) {
    issues.add({
      message: `Output does not exist: ${output}`,
      severity: "warn",
      fix: async () => {
        await writeTemplateOutput(options);
      },
    });
  }

  if (!!lastOutput && lastOutput < lastUpdate) {
    issues.add({
      message: `Output is outdated: ${output}`,
      severity: "warn",
      fix: async () => {
        await writeTemplateOutput(options);
      },
    });
  }

  if (isInGitRepository && !isGitIgnored) {
    issues.add({
      message: `Output is not gitignored: ${output}`,
    });
  }

  return {
    template: options.templateFile,
    templatePath,
    lastUpdate,
    output,
    outputPath,
    lastOutput,
  };
};

export type Templates = Template[];

export type GetTemplatesOptions = GetConfigOptions & {
  /** The templates glob pattern to get. */
  templatesGlobPattern?: string[];
};

/**
 * Get the templates from the project
 *
 * @returns The templates found in the project
 */
export const getTemplates = async (
  options: GetTemplatesOptions,
): Promise<Templates> => {
  const { globby } = await import("globby");
  const { default: multimatch } = await import("multimatch");

  const config = await getConfig(options);

  if (!config) {
    return [];
  }

  const { templatesGlobPattern = ["**/*.secret"] } = options;

  const templatesFound = await globby(["**/*.secret", "!**/.secret"], {
    cwd: config.root,
    gitignore: config.gitignore,
    ignoreFiles: [
      ...(config.gitignore ? ["**/.gitignore"] : []),
      "**/.secretignore",
    ],
    dot: true,
  });

  const templatesFiltered = multimatch(templatesFound, templatesGlobPattern, {
    dot: true,
  });

  const templates = await Promise.all(
    templatesFiltered.map(async (templateFile) =>
      getTemplate({ ...options, templateFile }),
    ),
  );

  return templates.filter((template): template is Template => !!template);
};

export class TemplateRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Template render error";
  }
}

export type GetTemplateEngineOptions = GetConfigOptions;

export const getTemplateEngine = async (options: GetTemplateEngineOptions) => {
  if (GLOBAL_ENGINE) {
    return GLOBAL_ENGINE;
  }

  const config = await getConfig(options);

  if (!config) {
    return undefined;
  }

  GLOBAL_ENGINE = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(config.root),
    { autoescape: false },
  );

  const filterHandler = (name: string, filter: Function) =>
    GLOBAL_ENGINE.addFilter(name, (...args) => {
      try {
        return filter(...args);
      } catch (error) {
        const message = (error as Error).message || String(error);

        throw new TemplateRenderError(`${name} filter: ${message}`);
      }
    });

  filterHandler("encodeURIComponent", filterEncodeURIComponent);
  filterHandler("decodeURIComponent", filterDecodeURIComponent);
  filterHandler("base64encode", filterBase64encode);
  filterHandler("base64decode", filterBase64decode);
  filterHandler("hash", filterHash);
  filterHandler("encrypt", filterEncrypt);
  filterHandler("decrypt", filterDecrypt);
  filterHandler("formatDate", filterFormatDate);
  filterHandler("json", filterJson);
  filterHandler("keyValue", filterKeyValue);
  filterHandler("yaml", filterYaml);

  return GLOBAL_ENGINE;
};

export type GetTemplateDataOptions = GetConfigOptions;

export const getTemplateData = async (options: GetTemplateDataOptions = {}) => {
  if (GLOBAL_DATA) {
    return { ...GLOBAL_DATA };
  }

  const secrets = await readSecrets(options);

  GLOBAL_DATA = {
    SECRETS: secrets,
  };

  return { ...GLOBAL_DATA };
};

export type WriteTemplateOutputOptions = GetConfigOptions & {
  /** The template file to write. */
  templateFile: string;
};

export const writeTemplateOutput = async (
  options: WriteTemplateOutputOptions,
) => {
  const template = await getTemplate(options);
  const engine = await getTemplateEngine(options);
  const data = await getTemplateData(options);

  if (!template || !engine || !data) {
    return;
  }

  try {
    const renderedTemplate = engine.render(template.templatePath, data);

    await nodeFs.promises.writeFile(template.outputPath, renderedTemplate);
  } catch (error) {
    issues.error(error);
  }
};

export type DeleteTemplateOutputOptions = GetConfigOptions & {
  /** The template file to delete. */
  templateFile: string;
};

export const deleteTemplateOutput = async (
  options: DeleteTemplateOutputOptions,
) => {
  const config = await getConfig(options);
  const template = await getTemplate(options);

  if (!config || !template) {
    return;
  }

  const outputPath = nodePath.join(config.root, template.output);

  try {
    await nodeFs.promises.rm(outputPath);
  } catch (error) {
    issues.error(error);
  }
};
