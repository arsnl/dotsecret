import _prompts from "prompts";
import { getLogger } from "@/lib/logger";

const handlePromptCancel = async () => {
  const { default: chalk } = await import("chalk");
  const { logger } = getLogger();
  logger.log(`${chalk.red("✖")} Process exited by user`);
  process.exit(0);
};

export const prompt = (...args: Parameters<typeof _prompts>) => {
  const [question, options = {}, ...otherArgs] = args;

  return _prompts(
    question,
    {
      ...options,
      onCancel: options?.onCancel ?? handlePromptCancel,
    },
    ...otherArgs,
  );
};

export const promptConfirm = async ({
  message,
  initial = false,
}: {
  message: string;
  initial?: boolean;
}) => {
  const { confirmed } = await prompt({
    type: "confirm",
    name: "confirmed",
    message,
    initial,
  });

  return confirmed;
};

export const promptConfirmOrAbort = async (message: string) => {
  const { default: chalk } = await import("chalk");
  const { default: boxen } = await import("boxen");
  const { logger } = getLogger();

  logger.log(
    boxen(message, {
      borderColor: "red",
      borderStyle: "round",
      textAlignment: "center",
      padding: 1,
      width: 120,
    }),
  );

  const saidYes = await promptConfirm({ message: "Do you want to continue?" });

  if (!saidYes) {
    logger.info(`${chalk.red("✖")} Aborded`);
    process.exit(0);
  }
};
