import axios, { AxiosError, type AxiosResponse } from "axios";
import nodePath from "node:path";
import { getIssuesCollector, type IssuesCollector } from "@/services/issue";
import { memoize } from "@/utils";

const axiosResponseHandler = async (
  response: Promise<AxiosResponse>,
  issuesCollector: IssuesCollector = getIssuesCollector({ scope: "vault" }),
) => {
  let data;
  let source;
  try {
    const awaitedResponse = await response;
    source = awaitedResponse.config.url;
    data = awaitedResponse.data;
  } catch (error) {
    const errors: any[] = [];

    if (error instanceof AxiosError) {
      source = error.config?.url;
      errors.push(...[error.response?.data?.errors || [error.message]]);
    } else if (error instanceof Error) {
      errors.push(error.message);
    } else {
      errors.push(String(error));
    }

    data = { errors };
  }

  if (data?.errors) {
    throw issuesCollector
      .add({
        message: `Vault returned errors\n- ${data.errors.join("\n- ")}`,
        source,
      })
      .error();
  }

  return data;
};

export type VaultSecret = {
  data: Record<string, unknown>;
  metadata: {
    /** The time the secret was created. */
    created_time: string;
    /** The custom metadata of the secret. */
    custom_metadata: unknown;
    /** The time the secret was deleted or planned to be. */
    deletion_time: string;
    /** Whether the secret has been destroyed. */
    destroyed: boolean;
    /** The version of the secret. */
    version: number;
  };
};

export const fetchVaultSecret = memoize(
  async ({
    address,
    namespace = "",
    path,
    token,
    issuesCollector,
    headers = {},
  }: {
    address: string;
    namespace?: string;
    path: string;
    token: string;
    issuesCollector?: IssuesCollector;
    headers?: Record<string, string>;
  }) => {
    const pathname = nodePath.join("/v1", namespace, "data", path);
    const url = new URL(pathname, address).href;

    const response = await axiosResponseHandler(
      axios({
        url,
        method: "GET",
        headers: {
          "X-Vault-Token": token,
          ...headers,
        },
      }),
      issuesCollector,
    );

    return (response?.data || null) as VaultSecret | null;
  },
);

export type VaultTokenLookup = {
  accessor: string;
  creation_time: number;
  creation_ttl: number;
  display_name: string;
  entity_id: string;
  expire_time: string;
  explicit_max_ttl: number;
  external_namespace_policies: Record<string, unknown>;
  id: string;
  identity_policies: string[];
  issue_time: string;
  last_renewal: string;
  last_renewal_time: number;
  meta: Record<string, unknown>;
  num_uses: number;
  orphan: boolean;
  path: string;
  policies: string[];
  ttl: number;
  type: string;
  renewable: boolean;
  lease_id: string;
};

export const fetchVaultTokenLookup = memoize(
  async ({
    address,
    token,
    issuesCollector,
    headers = {},
  }: {
    address: string;
    token: string;
    issuesCollector?: IssuesCollector;
    headers?: Record<string, string>;
  }) => {
    const pathname = nodePath.join("/v1", "auth/token/lookup-self");
    const url = new URL(pathname, address).href;

    const response = await axiosResponseHandler(
      axios({
        url,
        method: "GET",
        headers: {
          "X-Vault-Token": token,
          ...headers,
        },
      }),
      issuesCollector,
    );

    return (
      response?.data
        ? { ...response?.data, lease_id: response?.lease_id || "" }
        : null
    ) as VaultTokenLookup | null;
  },
);

export type VaultTokenRenew = {
  request_id: string;
  lease_id: string;
  renewable: boolean;
  lease_duration: number;
  data: unknown;
  wrap_info: unknown;
  warnings: string[];
  auth: {
    client_token: string;
    accessor: string;
    policies: string[];
    metadata: Record<string, unknown>;
    lease_duration: number;
    renewable: boolean;
    entity_id: string;
    token_type: string;
    orphan: boolean;
  };
};

export const fetchVaultTokenRenew = memoize(
  async ({
    address,
    token,
    issuesCollector,
    headers = {},
  }: {
    address: string;
    token: string;
    issuesCollector?: IssuesCollector;
    headers?: Record<string, string>;
  }) => {
    const pathname = nodePath.join("/v1", "auth/token/renew-self");
    const url = new URL(pathname, address).href;

    const response = await axiosResponseHandler(
      axios({
        url,
        method: "POST",
        headers: {
          "X-Vault-Token": token,
          ...headers,
        },
      }),
      issuesCollector,
    );

    return (response || null) as VaultTokenRenew | null;
  },
);
