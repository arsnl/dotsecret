import { type CommandOptions } from "@/services/command";
import { getConfig } from "@/services/config";
import { getIssuesCollector } from "@/services/issue";
import { getProjectFromStore } from "@/services/project";
import { getStore, writeStore } from "@/services/store";
import {
  fetchVaultTokenLookup,
  fetchVaultTokenRenew,
  type VaultTokenLookup,
} from "@/services/vault";

export type Token = {
  /** The key associate to the token. */
  key: string;
  /** The token value. */
  value: string;
  /** The Vault address. */
  address: string;
  /** The token metadata. */
  metadata: VaultTokenLookup | null;
  /** If the token came from the store or the options */
  fromStore: boolean;
};

export const getToken = async ({
  options,
  token,
}: {
  options: CommandOptions;
  token: string;
}): Promise<Token> => {
  const config = await getConfig({ options });
  const storeProject = await getProjectFromStore({ options });
  const issuesCollector = getIssuesCollector({ scope: "token", source: token });
  const tokensInStore = storeProject?.tokens || {};
  const tokensInOptions = options.tokens || {};
  const tokens = {
    ...tokensInStore,
    ...tokensInOptions,
  };
  const tokenValue = tokens?.[token] || "";

  if (!tokenValue) {
    throw issuesCollector.add({ message: "Token not found" }).error();
  }

  const fromStore = !tokensInOptions[token];

  const secretsUsingIt = Object.values(config.secrets || {}).filter(
    (secret) => secret.token === token,
  );

  if (!secretsUsingIt.length) {
    issuesCollector.add({
      message: `Token is not used`,
      severity: "warn",
      fix: async () => {
        await removeTokensFromStore({ options, tokens: [token] });
      },
    });

    return {
      key: token,
      value: tokenValue,
      address: "",
      metadata: null,
      fromStore,
    };
  }

  const addresses = secretsUsingIt.reduce((acc, secret) => {
    if (!acc.includes(secret.address)) {
      return [...acc, secret.address];
    }

    return acc;
  }, [] as string[]);

  if (addresses.length > 1) {
    throw issuesCollector
      .add({
        message: `Token have inconsistent addresses\n- ${addresses.join(
          "\n- ",
        )}`,
      })
      .error();
  }

  const address = addresses[0];

  const vaultTokenLookup = await fetchVaultTokenLookup({
    address,
    token: tokenValue,
    issuesCollector,
  });

  if (
    vaultTokenLookup?.expire_time &&
    new Date(vaultTokenLookup.expire_time) < new Date()
  ) {
    throw issuesCollector.add({ message: "Token has expired" }).error();
  }

  return {
    key: token,
    value: tokenValue,
    address,
    metadata: vaultTokenLookup,
    fromStore,
  };
};

export const getTokens = async ({
  options,
  tokens = [],
}: {
  options: CommandOptions;
  tokens?: string[];
}): Promise<Token[]> => {
  const storeProject = await getProjectFromStore({ options });
  const tokensInStore = storeProject?.tokens || {};
  const tokensInOptions = options.tokens || {};
  const tokensFound = Object.keys({ ...tokensInStore, ...tokensInOptions });

  const tokensFiltered = tokens.length
    ? tokensFound.filter((template) => tokens.includes(template))
    : tokensFound;

  return Promise.all(
    tokensFiltered.map(async (token) => getToken({ options, token })),
  );
};

export const renewToken = async ({
  options,
  token,
}: {
  options: CommandOptions;
  token: string;
}) => {
  const issuesCollector = getIssuesCollector({ scope: "token", source: token });
  const tokenProject = await getToken({ options, token });

  return fetchVaultTokenRenew({
    address: tokenProject.address,
    token: tokenProject.value,
    issuesCollector,
  });
};

export const renewTokens = async ({
  options,
  tokens = [],
}: {
  options: CommandOptions;
  tokens?: string[];
}) => {
  const tokensFound = await getTokens({ options, tokens });

  return Promise.all(
    tokensFound.map(async (token) => renewToken({ options, token: token.key })),
  );
};

export const addTokensToStore = async ({
  options,
  tokens = {},
}: {
  options: CommandOptions;
  tokens: { [key: string]: string };
}): Promise<void> => {
  const store = await getStore({ options });
  const { project } = await getConfig({ options });
  const storeProject = store.data.projects[project] || { tokens: {} };
  const storeProjectTokens = { ...(storeProject?.tokens || {}) };

  const updatedStoreData = {
    ...store.data,
    projects: {
      ...store.data.projects,
      [project]: {
        ...storeProject,
        tokens: {
          ...storeProjectTokens,
          ...tokens,
        },
      },
    },
  };

  await writeStore({ options, data: updatedStoreData });
};

export const removeTokensFromStore = async ({
  options,
  tokens,
}: {
  options: CommandOptions;
  tokens: string[];
}): Promise<void> => {
  const store = await getStore({ options });
  const { project } = await getConfig({ options });
  const storeProject = store.data.projects[project];
  const storeProjectTokens = { ...(storeProject?.tokens || {}) };

  tokens.forEach((token) => {
    delete storeProjectTokens[token];
  });

  const updatedStoreData = {
    ...store.data,
    projects: {
      ...store.data.projects,
      [project]: {
        ...storeProject,
        tokens: storeProjectTokens,
      },
    },
  };

  await writeStore({ options, data: updatedStoreData });
};
