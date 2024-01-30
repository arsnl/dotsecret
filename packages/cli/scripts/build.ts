#!/usr/bin/env node

import pkg from "@pkg";
import { $, execa } from "execa";
import nodeFs from "node:fs";
import { build } from "tsup";

const writePackageJson = async () => {
  const { devDependencies, scripts, ...rest } = pkg;
  const packageJson = {
    ...rest,
    main: "cli.js",
    bin: {
      [pkg.name]: "cli.js",
    },
  };

  await nodeFs.promises.writeFile(
    "dist/package.json",
    JSON.stringify(packageJson, null, 2),
  );
};

(async () => {
  const isDev = process.argv.includes("--dev");

  await $`shx rm -rf dist`;
  await $`shx mkdir dist`;
  await $`shx cp README.md dist/README.md`;
  await writePackageJson();

  await build({
    entryPoints: ["src/cli.ts"],
    format: ["esm"],
    minify: false,
    sourcemap: false,
    splitting: true,
    clean: false,
    dts: true,
    watch: isDev,
    async onSuccess() {
      if (isDev) {
        await execa("npx", ["yalc", "publish", "--push"], {
          cwd: "dist",
          stdio: "inherit",
        });
      }
    },
  });
})();
