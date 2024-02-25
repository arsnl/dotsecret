import nodeFs from "node:fs";
import nodePath from "node:path";
import nunjucks from "nunjucks";
import { globby } from "@/esm-only/globby";
import multimatch from "@/esm-only/multimatch";
import { type CommandOptions } from "@/services/command";
import { getConfig } from "@/services/config";
import {
  filterBase64decode,
  filterBase64encode,
  filterDecodeURIComponent,
  filterDecrypt,
  filterEncodeURIComponent,
  filterEncrypt,
  filterFormatDate,
  filterHash,
  filterJson,
  filterKeyValue,
  filterYaml,
} from "@/services/filter";
import { getIssuesCollector } from "@/services/issue";
import { getSecrets } from "@/services/secret";
import {
  getFileLastUpdate,
  isFileExists,
  isInGitRepository as isInGitRepo,
  isPathIgnoredByGit,
  isPathWriteable,
} from "@/utils";

let GLOBAL_ENGINE: nunjucks.Environment;
let GLOBAL_DATA: any;

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
  const { extension, project } = await getConfig({ options });
  const output = template.replace(extension, "");
  const templatePath = nodePath.join(project, template);
  const templateExists = await isFileExists(templatePath);
  const outputPath = nodePath.join(project, output);
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
  const { extension, gitignore, ignoreFiles, project } = await getConfig({
    options,
  });

  const templatesFound = await globby([`**/*${extension}`], {
    cwd: project,
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

  const { project } = await getConfig({ options });

  GLOBAL_ENGINE = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(project),
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

  const secrets = (await getSecrets({ options })).reduce(
    (data, secret) => ({
      ...data,
      [secret.key]: secret.data,
    }),
    {},
  );

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
  const { project } = await getConfig({ options });
  const { output } = await getTemplate({ options, template });
  const outputPath = nodePath.join(project, output);
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
