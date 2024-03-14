import { type GetConfigOptions } from "@/lib/config";
import { readSecrets } from "@/lib/secret";

let TEMPLATE_DATA: any;

export type GetTemplateDataOptions = {
  /** The configuration options */
  config?: GetConfigOptions;
};

export const getTemplateData = async (options: GetTemplateDataOptions = {}) => {
  if (TEMPLATE_DATA) {
    return { ...TEMPLATE_DATA };
  }

  const secrets = await readSecrets({ config: options?.config });

  TEMPLATE_DATA = {
    SECRETS: secrets,
  };

  return { ...TEMPLATE_DATA };
};
