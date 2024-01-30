// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  outDir: "dist",
  dts: false,
  splitting: true,
  sourcemap: false,
  format: ["esm"],
  clean: true,
});
