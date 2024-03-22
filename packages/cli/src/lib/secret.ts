import dotenv from "dotenv";
import { type ConfigOptionExtend, getConfig } from "@/lib/config";
import { issues } from "@/lib/issue";
import { getAbsolutePath, isFileExists } from "@/lib/utils";

export type ReadSecretsOptions = ConfigOptionExtend & {};

/**
 * Read the secrets from the `.secret` file
 *
 * @returns The secrets if found, undefined otherwise
 */
export const readSecrets = async <
  T extends {
    [name: string]: string;
  },
>(
  options: ReadSecretsOptions,
): Promise<T | undefined> => {
  const config = await getConfig(options?.config);

  if (!config) {
    return undefined;
  }

  const path = getAbsolutePath(".secret", config.root);
  const { error, parsed } = dotenv.config({ path, encoding: "utf8" });

  if (!isFileExists(path)) {
    issues.add({
      message: "No secrets found. You must run `dotsecret pull` before.",
    });
    return undefined;
  }

  if (error) {
    issues.add({
      message: `Error while reading the secrets: ${error.message}`,
    });
    return undefined;
  }

  if (!parsed) {
    issues.add({
      message: "No secrets found. You must run `dotsecret pull` before.",
    });
    return undefined;
  }

  return parsed as T;
};
