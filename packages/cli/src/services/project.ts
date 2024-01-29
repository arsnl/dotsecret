import { type CommandOptions } from "@/services/command";
import { getConfig } from "@/services/config";
import { getStore, type StoreData, writeStore } from "@/services/store";

export type StoreProject = StoreData["projects"][string];

export const getProjectFromStore = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<StoreProject | null> => {
  const { project } = await getConfig({ options });
  const store = await getStore({ options });
  const storeProject = store?.data?.projects?.[project];

  if (!storeProject) {
    return null;
  }

  return storeProject;
};

export const removeProjectFromStore = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<void> => {
  const store = await getStore({ options });
  const { project } = await getConfig({ options });

  if (!store?.data?.projects?.[project]) {
    return;
  }

  const { [project]: _, ...projects } = store.data.projects;

  const updatedStoreData = {
    ...store.data,
    projects: {
      ...projects,
    },
  };

  await writeStore({ options, data: updatedStoreData });
};
