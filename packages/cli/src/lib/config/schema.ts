import { z } from "zod";

/** The dotsecret configuration. */
export const ConfigSchema = z
  .object({
    /** Weither or not to respect ignore patterns in .gitignore files that apply to the dotsecret files. */
    gitignore: z
      .boolean()
      .default(true)
      .describe(
        "Weither or not to respect ignore patterns in .gitignore files that apply to the dotsecret files.",
      ),
  })
  .strict()
  .describe("The dotsecret configuration.");

/** The processed dotsecret configuration. */
export const ConfigOuputSchema = ConfigSchema.extend({
  /** The current working directory. */
  cwd: z.string().describe("The current working directory."),
  /** The dotsecret configuration file path. */
  config: z.string().describe("The dotsecret configuration file path."),
  /** The root of the current project. */
  root: z.string().describe("The root of the current project."),
})
  .strict()
  .describe("The processed dotsecret configuration.");
