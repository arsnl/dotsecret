// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  outDir: "dist",
  dts: true,
  splitting: false,
  sourcemap: true,
  // We need to include theses packages in the bundle since they are ESM only and need to be converted to CJS.
  noExternal: [
    "boxen",
    "chalk",
    "color-json",
    "execa",
    "find-up",
    "globby",
    "multimatch",
    "ora",
  ],
  clean: true,
});
