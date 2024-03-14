import nunjucks from "nunjucks";
import { getConfig, type GetConfigOptions } from "@/lib/config";
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
} from "./filter";

let TEMPLATE_ENGINE: nunjucks.Environment;

class TemplateRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Template render error";
  }
}

const filterHandler = (name: string, filter: Function) =>
  TEMPLATE_ENGINE?.addFilter(name, (...args) => {
    try {
      return filter(...args);
    } catch (error) {
      const message = (error as Error).message || String(error);

      throw new TemplateRenderError(`${name} filter: ${message}`);
    }
  });

export type GetTemplateEngineOptions = {
  /** The configuration options */
  config?: GetConfigOptions;
};

export const getTemplateEngine = async (
  options: GetTemplateEngineOptions = {},
) => {
  if (TEMPLATE_ENGINE) {
    return TEMPLATE_ENGINE;
  }

  const config = await getConfig(options?.config);

  if (!config) {
    return undefined;
  }

  TEMPLATE_ENGINE = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(config.root),
    { autoescape: false },
  );

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

  return TEMPLATE_ENGINE;
};
