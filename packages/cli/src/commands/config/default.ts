import colorJson from "@/esm-only/color-json";
import { getCommand } from "@/services/command";
import { getDefaultConfig } from "@/services/config";
import { getLogger } from "@/services/logger";

const summary = `Show default configuration`;
const description = `The default configuration is used when no configuration is found for a project. It is also used to merge with the configuration of a project. That means that the default configuration is always used as a base configuration. When you don't specify a property in your configuration, the default configuration property value will be used.`;

export const getDefaultCommand = async () => {
  const command = getCommand({
    name: "default",
    summary,
    description,
  });

  command.action(async (options) => {
    const { logger } = getLogger({ options });
    const config = await getDefaultConfig({ options });

    logger.log(colorJson(config));
  });

  return command;
};
