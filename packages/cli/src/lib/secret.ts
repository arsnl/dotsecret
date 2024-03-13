import dotenv from "dotenv";
import nodePath from "node:path";
import { getConfig, type GetConfigOptions } from "@/lib/config";
import { issues } from "@/lib/issue";
import { isFileExists } from "@/lib/utils";

export type ReadSecretsOptions = GetConfigOptions;

/**
 * Read the secrets from the `.secret` file
 *
 * @returns The secrets if found, `undefined` otherwise
 */
export const readSecrets = async <
  T extends {
    [name: string]: string;
  },
>(
  options: ReadSecretsOptions = {},
): Promise<T | undefined> => {
  const config = await getConfig(options);

  if (!config) {
    return undefined;
  }

  const path = nodePath.join(config.root, ".secret");
  const exists = isFileExists(path);

  if (!exists) {
    issues.add({
      message: "No secrets found. You must run `dotsecret pull` before.",
    });
    return undefined;
  }

  const secretOutput = dotenv.config({
    path,
    encoding: "utf8",
  });

  if (secretOutput.error) {
    issues.add({
      message: `Error while reading the secrets: ${secretOutput.error.message}`,
    });
    return undefined;
  }

  if (!secretOutput.parsed) {
    issues.add({
      message: "No secrets found. You must run `dotsecret pull` before.",
    });
    return undefined;
  }

  return secretOutput.parsed as T;
};
