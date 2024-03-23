import { type ConfigOptionExtend } from "@/lib/config";
import { readSecrets } from "@/lib/secret";

let TEMPLATE_DATA: any;

export const getTemplateData = async (options: ConfigOptionExtend) => {
  if (TEMPLATE_DATA) {
    return { ...TEMPLATE_DATA };
  }

  const secrets = await readSecrets({ config: options?.config });

  TEMPLATE_DATA = {
    SECRETS: secrets,
  };

  return { ...TEMPLATE_DATA };
};
