import nunjucks from "nunjucks";
import { type ConfigOptionExtend, getConfig } from "@/lib/config";
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

const templateFilterHandler = (name: string, filter: Function) =>
  TEMPLATE_ENGINE?.addFilter(name, (...args) => {
    try {
      return filter(...args);
    } catch (error) {
      const message = (error as Error).message || String(error);

      throw new TemplateRenderError(`${name} filter: ${message}`);
    }
  });

export const getTemplateEngine = async (options: ConfigOptionExtend) => {
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

  templateFilterHandler("encodeURIComponent", filterEncodeURIComponent);
  templateFilterHandler("decodeURIComponent", filterDecodeURIComponent);
  templateFilterHandler("base64encode", filterBase64encode);
  templateFilterHandler("base64decode", filterBase64decode);
  templateFilterHandler("hash", filterHash);
  templateFilterHandler("encrypt", filterEncrypt);
  templateFilterHandler("decrypt", filterDecrypt);
  templateFilterHandler("formatDate", filterFormatDate);
  templateFilterHandler("json", filterJson);
  templateFilterHandler("keyValue", filterKeyValue);
  templateFilterHandler("yaml", filterYaml);

  return TEMPLATE_ENGINE;
};
