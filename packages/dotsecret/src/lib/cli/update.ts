import { getLogger } from "@/lib/logger";
import pkg from "@/lib/package";

export const updateNotify = async () => {
  const { default: chalk } = await import("chalk");
  const { default: boxen } = await import("boxen");
  const { default: updateNotifier } = await import("update-notifier");

  const { logger } = getLogger();
  const notifier = updateNotifier({
    pkg,
    distTag: pkg.distTag,
    updateCheckInterval: 1000 * 60 * 60, // 1 day
  });

  if (notifier.update && notifier.update.latest !== notifier.update.current) {
    logger.warn(
      boxen(
        `Update available ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}
See changelog at dotsecret.org/changelog`,
        {
          borderColor: "yellow",
          borderStyle: "round",
          textAlignment: "center",
          padding: 1,
        },
      ),
    );
  }
};
