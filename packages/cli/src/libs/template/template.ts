import dayjs from "dayjs";
import yaml from "js-yaml";
import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodePath from "node:path";
import nunjucks from "nunjucks";
import { type CommandOptions } from "@/libs/command";
import { getConfig } from "@/libs/config";
import {
  getFileLastUpdate,
  isFileExists,
  isInGitRepository as isInGitRepo,
  isPathIgnoredByGit,
  isPathWriteable,
} from "@/libs/fs";
import { getIssuesCollector } from "@/libs/issue";
import { getLocalSecrets } from "@/libs/secret";
import { globby } from "@/vendors/globby";
import multimatch from "@/vendors/multimatch";

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
  lastOutput: Date | null;
};

export const getTemplate = async ({
  options,
  template,
}: {
  options: CommandOptions;
  template: string;
}): Promise<Template> => {
  const { projectRoot } = await getConfig({ options });
  const output = template.replace(".secret", "");
  const templatePath = nodePath.join(projectRoot, template);
  const templateExists = await isFileExists(templatePath);
  const outputPath = nodePath.join(projectRoot, output);
  const lastUpdate = (await getFileLastUpdate(templatePath)) || new Date();
  const lastOutput = await getFileLastUpdate(outputPath);
  const hasWriteAccess = await isPathWriteable(outputPath);
  const isInGitRepository = await isInGitRepo(outputPath);
  const isGitIgnored = await isPathIgnoredByGit(outputPath);
  const issuesCollector = getIssuesCollector({
    scope: "template",
    source: template,
  });

  if (!templateExists) {
    throw issuesCollector
      .add({
        message: "Template does not exist",
      })
      .error();
  }

  if (!hasWriteAccess) {
    throw issuesCollector
      .add({
        message: "Output is not writeable",
      })
      .error();
  }

  if (lastOutput === null) {
    issuesCollector.add({
      message: "Output does not exist",
      severity: "warn",
      fix: async () => {
        await writeTemplateOutput({ options, template });
      },
    });
  }

  if (lastOutput !== null && lastOutput < lastUpdate) {
    issuesCollector.add({
      message: "Output is out of date",
      severity: "warn",
      fix: async () => {
        await writeTemplateOutput({ options, template });
      },
    });
  }

  if (isInGitRepository && !isGitIgnored) {
    throw issuesCollector
      .add({
        message: "Output is not ignored by Git",
      })
      .error();
  }

  return {
    template,
    templatePath,
    lastUpdate,
    output,
    outputPath,
    lastOutput,
  };
};

export type Templates = Template[];

export const getTemplates = async ({
  options,
  templates = ["**/*"],
}: {
  options: CommandOptions;
  templates?: string[];
}): Promise<Templates> => {
  const { gitignore, ignoreFiles, projectRoot } = await getConfig({
    options,
  });

  const templatesFound = await globby([`**/*.secret`], {
    cwd: projectRoot,
    gitignore,
    ignoreFiles,
    dot: true,
  });

  const templatesFiltered = multimatch(templatesFound, templates, {
    dot: true,
  });

  return Promise.all(
    templatesFiltered.map(async (template) =>
      getTemplate({ options, template }),
    ),
  );
};

export class TemplateRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Template render error";
  }
}

export const getTemplateEngine = async ({
  options,
}: {
  options: CommandOptions;
}) => {
  if (GLOBAL_ENGINE) {
    return GLOBAL_ENGINE;
  }

  const { projectRoot } = await getConfig({ options });

  GLOBAL_ENGINE = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(projectRoot),
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

export const getTemplateData = async ({
  options,
}: {
  options: CommandOptions;
}) => {
  if (GLOBAL_DATA) {
    return { ...GLOBAL_DATA };
  }

  const secrets = await getLocalSecrets({ options });

  GLOBAL_DATA = {
    secrets,
  };

  return { ...GLOBAL_DATA };
};

export const writeTemplateOutput = async ({
  options,
  template,
}: {
  options: CommandOptions;
  template: string;
}) => {
  const issuesCollector = getIssuesCollector({
    scope: "template",
    source: template,
  });
  const { templatePath, outputPath } = await getTemplate({ options, template });
  const engine = await getTemplateEngine({ options });
  const data = await getTemplateData({ options });

  try {
    const renderedTemplate = engine.render(templatePath, data);

    await nodeFs.promises.writeFile(outputPath, renderedTemplate);
  } catch (error) {
    throw issuesCollector.addError(error).error();
  }
};

export const deleteTemplateOutput = async ({
  options,
  template,
}: {
  options: CommandOptions;
  template: string;
}) => {
  const { projectRoot } = await getConfig({ options });
  const { output } = await getTemplate({ options, template });
  const outputPath = nodePath.join(projectRoot, output);
  const issuesCollector = getIssuesCollector({
    scope: "template",
    source: template,
  });

  try {
    await nodeFs.promises.rm(outputPath);
  } catch (error) {
    throw issuesCollector.addError(error).error();
  }
};
