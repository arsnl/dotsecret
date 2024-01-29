import nodeOs from "node:os";
import nodePath from "node:path";
import { z } from "zod";
import { type CommandOptions } from "@/services/command";
import { getIssuesCollector } from "@/services/issue";
import { getLogger } from "@/services/logger";
import {
  deleteFile,
  getFilePermissions,
  isFileExists,
  memoize,
  readYamlFile,
  setFilePermissions,
  writeYamlFile,
} from "@/utils";

export const STORE_FILENAME = ".vaulty-store";
export const STORE_FILE_MODE = "600"; // owner only can read and write

/** The store data */
export const StoreDataSchema = z
  .object({
    /** The store projects. */
    projects: z
      .record(
        /** A project. */
        z
          .object({
            /** The project tokens. */
            tokens: z
              .record(
                /** The token key. */
                z.string().describe("The token key."),
                /** The token value. */
                z.string().describe("The token value."),
              )
              .default({})
              .describe("The project tokens."),
          })
          .strict()
          .describe("A project."),
      )
      .default({})
      .describe("The store projects."),
  })
  .strict()
  .describe("The store.");

export type StoreData = z.infer<typeof StoreDataSchema>;

export type Store = {
  /** The path to the store file. */
  source: string;
  /** Whether the store file exists */
  exists: boolean;
  /** The store data */
  data: StoreData;
};

export const getStore = memoize(
  async ({ options }: { options: CommandOptions }): Promise<Store> => {
    const { logger } = getLogger({ options });
    const source = nodePath.join(nodeOs.homedir(), STORE_FILENAME);
    const exists = await isFileExists(source);
    const permissions = await getFilePermissions(source);
    const issuesCollector = getIssuesCollector({ scope: "store", source });

    if (exists && permissions !== STORE_FILE_MODE) {
      issuesCollector.add({
        message: `Permissions are not valid (${permissions} instead of ${STORE_FILE_MODE})`,
        fix: async () => {
          const success = await setFilePermissions(source, STORE_FILE_MODE);

          if (!success) {
            logger.error(
              `Unable to set the permissions to ${STORE_FILE_MODE}. Please do it manually.`,
            );
          }
        },
      });
    }

    const rawData = await readYamlFile(source);

    if (exists && !rawData) {
      issuesCollector.add({
        message: "Problem reading the store file",
        fix: async () => {
          await resetStore({ options });
        },
      });
    }

    const parsed = StoreDataSchema.safeParse(
      rawData || StoreDataSchema.parse({}),
    );
    const data = parsed.success ? parsed?.data : StoreDataSchema.parse({});

    if (!parsed.success) {
      issuesCollector.add({
        message: `Invalid store file\n${parsed?.error?.issues
          ?.map(
            (issue) =>
              `- ${issue.path.join(".") ? `${issue.path.join(".")}: ` : ""}${
                issue.message
              }`,
          )
          .join("\n")}`,
      });
    }

    return {
      source,
      exists,
      data,
    };
  },
);

export const writeStore = async ({
  options,
  data,
}: {
  options: CommandOptions;
  data: StoreData;
}): Promise<void> => {
  const store = await getStore({ options });

  await writeYamlFile(store.source, data, {
    mode: STORE_FILE_MODE,
  });
};

export const deleteStore = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<void> => {
  const store = await getStore({ options });

  if (store.exists && store.source) {
    await deleteFile(store.source);
  }
};

export const resetStore = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<void> => {
  await deleteStore({ options });
  await writeStore({ options, data: StoreDataSchema.parse({}) });
};
