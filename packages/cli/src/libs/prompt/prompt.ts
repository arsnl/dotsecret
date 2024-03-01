import _prompts from "prompts";
import { getLogger } from "@/libs/logger";
import boxen from "@/vendors/boxen";
import chalk from "@/vendors/chalk";

const handlePromptCancel = () => {
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

export const confirm = async ({
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

export const confirmOrAbort = async (message: string) => {
  const { logger } = getLogger();

  logger.log(
    boxen(message, {
      borderColor: "red",
      borderStyle: "round",
      textAlignment: "center",
      padding: 1,
      width: 80,
    }),
  );

  const saidYes = await confirm({ message: "Do you want to continue?" });

  if (!saidYes) {
    logger.info(`${chalk.red("✖")} Aborded`);
    process.exit(0);
  }
};
