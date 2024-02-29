import dotenv, { type DotenvConfigOutput } from "dotenv";
import nodePath from "node:path";
import { type CommandOptions } from "@/services/command";
import { getConfig } from "@/services/config";
import { getIssuesCollector } from "@/services/issue";
import { isFileExists } from "@/utils";

export const getLocalSecrets = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<DotenvConfigOutput> => {
  const { projectRoot } = await getConfig({ options });
  const issuesCollector = getIssuesCollector({ scope: "secret" });
  const localSecretFilePath = nodePath.join(projectRoot, ".secret.local");
  const localSecretFileExists = await isFileExists(localSecretFilePath);

  if (!localSecretFileExists) {
    throw issuesCollector
      .add({
        message:
          "No local secrets found. You must run `dotsecret pull` before.",
      })
      .error();
  }

  const secretOutput = dotenv.config({
    path: localSecretFilePath,
    encoding: "utf8",
  });

  if (secretOutput.error) {
    throw issuesCollector
      .add({
        message: `Error while reading the local secret file: ${secretOutput.error.message}`,
      })
      .error();
  }

  return secretOutput?.parsed || {};
};
