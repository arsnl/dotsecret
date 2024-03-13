// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from "tsup";

export default defineConfig({
  name: "dotsecret",
  target: "node16",
  entry: ["src/index.ts", "src/cli/index.ts"],
  outDir: "dist",
  dts: true,
  sourcemap: false,
  format: "cjs",
  clean: true,
});
