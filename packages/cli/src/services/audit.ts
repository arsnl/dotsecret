import { type CommandOptions } from "@/services/command";
import { getConfig } from "@/services/config";
import { getIssuesCollector } from "@/services/issue";
import { getProjectFromStore } from "@/services/project";
import { getSecrets } from "@/services/secret";
import { getStore } from "@/services/store";
import { getTemplates } from "@/services/template";
import { getTokens } from "@/services/token";

export const runAudit = async ({ options }: { options: CommandOptions }) => {
  const issuesCollector = getIssuesCollector();

  await Promise.all(
    [
      getConfig,
      getStore,
      getTokens,
      getProjectFromStore,
      getSecrets,
      getTemplates,
    ].map(async (service) => {
      try {
        await service({ options });
      } catch {
        // do nothing
      }
    }),
  );

  return { issuesCollector };
};
