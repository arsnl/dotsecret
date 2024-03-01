// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup";

export default defineConfig({
  name: "dotsecret",
  target: "node16",
  entry: ["src/index.ts", "src/cli.ts"],
  outDir: "dist",
  dts: true,
  sourcemap: false,
  format: "cjs",
  clean: true,
  // We need to include theses packages in the bundle since they are ESM only and need to be converted to CJS.
  // Every package here need to have a bridge file in src/vendors and a new eslint entry for the no-restricted-imports rule.
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
});
