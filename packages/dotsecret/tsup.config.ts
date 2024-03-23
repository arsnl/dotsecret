// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  target: "node16",
  entry: ["src/index.ts", "src/cli/index.ts"],
  outDir: "dist",
  dts: true,
  sourcemap: false,
  format: "cjs",
  clean: true,
  minify: options.watch ? false : "terser",
}));
