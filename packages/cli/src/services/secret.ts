import { type CommandOptions } from "@/services/command";
import { getConfig } from "@/services/config";
import { getIssuesCollector } from "@/services/issue";
import { getToken, type Token } from "@/services/token";
import { fetchVaultSecret, type VaultSecret } from "@/services/vault";

export type Secret = {
  /** The key associate to the secret in the configuration. */
  key: string;
  /** The Vault address. */
  address: string;
  /** The namespace in the Vault where the secret is stored */
  namespace?: string;
  /** The secret path. */
  path: string;
  /** The Vault token */
  token: Token;
  /** The secret metadata. */
  metadata: VaultSecret["metadata"];
  /** The secret data. */
  data: Record<string, unknown>;
};

export const getSecret = async ({
  options,
  secret,
}: {
  options: CommandOptions;
  secret: string;
}): Promise<Secret> => {
  const config = await getConfig({ options });
  const issuesCollector = getIssuesCollector({
    scope: "secret",
    source: secret,
  });
  const secretConfig = config?.secrets?.[secret];

  if (!secretConfig) {
    throw issuesCollector.add({ message: "Secret not found" }).error();
  }

  if (!/^[a-zA-Z0-9]+$/.test(secret)) {
    throw issuesCollector
      .add({
        message:
          "Invalid secret name. Please ensure the secret name contains only letters and numbers, and does not include any spaces.",
      })
      .error();
  }

  const token = await getToken({ options, token: secretConfig.token });

  const vaultSecret = await fetchVaultSecret({
    address: secretConfig.address,
    namespace: secretConfig.namespace,
    path: secretConfig.path,
    token: token.value,
    issuesCollector,
  });

  if (!vaultSecret || !vaultSecret?.data) {
    throw issuesCollector.add({ message: "Vault returned no data" }).error();
  }
  if (vaultSecret?.metadata?.destroyed) {
    throw issuesCollector.add({ message: "Secret has been destroyed" }).error();
  }

  return {
    key: secret,
    address: secretConfig.address,
    namespace: secretConfig.namespace,
    path: secretConfig.path,
    token,
    metadata: vaultSecret.metadata,
    data: vaultSecret.data,
  };
};

export type Secrets = Secret[];

export const getSecrets = async ({
  options,
}: {
  options: CommandOptions;
}): Promise<Secrets> => {
  const config = await getConfig({ options });

  return Promise.all(
    Object.entries(config.secrets).map(async ([secret]) =>
      getSecret({ options, secret }),
    ),
  );
};
