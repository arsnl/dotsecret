import stringify from "fast-json-stable-stringify";
import yaml from "js-yaml";
import nodeFs from "node:fs";
import nodePath from "node:path";
import { execa } from "@/esm-only/execa";

export function memoize<T extends (...args: any[]) => any>(fn: T) {
  const cache: Record<string, any> = {};

  // eslint-disable-next-line func-names -- need to support the async functions. no impact on the sync functions.
  return async function (this: any, ...args: any[]) {
    const key = stringify(args);
    cache[key] = cache[key] || fn.apply(this, args);
    return cache[key];
  } as T;
}

export const getAbsolutePath = (path: string) =>
  nodePath.isAbsolute(path) ? path : nodePath.resolve(path);

export const isPathExists = (path: string) => {
  const absolutePath = getAbsolutePath(path);

  return nodeFs.existsSync(absolutePath);
};

export const isFileExists = (path: string) => {
  const absolutePath = getAbsolutePath(path);

  return isPathExists(absolutePath) && nodeFs.lstatSync(absolutePath).isFile();
};

export const getFileLastUpdate = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const fileStats = await nodeFs.promises.stat(absolutePath);
    return fileStats.mtime;
  } catch {
    return null;
  }
};

export const getFileContent = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const fileContent = await nodeFs.promises.readFile(absolutePath, "utf-8");
    return fileContent;
  } catch {
    return null;
  }
};

export const deleteFile = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    await nodeFs.promises.unlink(absolutePath);
    return true;
  } catch {
    return false;
  }
};

export const getFilePermissions = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const stat = await nodeFs.promises.stat(absolutePath);
    // eslint-disable-next-line no-bitwise
    return (stat.mode & 0o777).toString(8);
  } catch {
    return null;
  }
};

export const setFilePermissions = async (
  path: string,
  mode: string | number,
) => {
  const absolutePath = getAbsolutePath(path);

  try {
    await nodeFs.promises.chmod(absolutePath, mode);
    return true;
  } catch {
    return false;
  }
};

export const readYamlFile = async <T>(path: string) => {
  const absolutePath = getAbsolutePath(path);
  const fileContent = await getFileContent(absolutePath);

  if (!fileContent) {
    return null;
  }

  try {
    const fileContentParsed = yaml.load(fileContent) as T;
    return fileContentParsed;
  } catch {
    return null;
  }
};

export const writeYamlFile = async <T>(
  path: string,
  content: T,
  options: nodeFs.ObjectEncodingOptions & {
    mode?: nodeFs.Mode | undefined;
    flag?: nodeFs.OpenMode | undefined;
  } = {},
) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const fileContent = yaml.dump(content, { lineWidth: -1 });
    await nodeFs.promises.writeFile(absolutePath, fileContent, {
      encoding: "utf-8",
      ...options,
    });
    return true;
  } catch {
    return false;
  }
};

export const readJsonFile = async <T>(path: string) => {
  const absolutePath = getAbsolutePath(path);
  const fileContent = await getFileContent(absolutePath);

  if (!fileContent) {
    return null;
  }

  try {
    const fileContentParsed = JSON.parse(fileContent) as T;
    return fileContentParsed;
  } catch {
    return null;
  }
};

export const writeJsonFile = async <T>(
  path: string,
  content: T,
  options: nodeFs.ObjectEncodingOptions & {
    mode?: nodeFs.Mode | undefined;
    flag?: nodeFs.OpenMode | undefined;
  } = {},
) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const fileContent = JSON.stringify(content, null, 2);
    await nodeFs.promises.writeFile(absolutePath, fileContent, {
      encoding: "utf-8",
      ...options,
    });
    return true;
  } catch {
    return false;
  }
};

export const isPathWriteable = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const cwd = nodePath.parse(absolutePath).dir;
    await nodeFs.promises.access(cwd, nodeFs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

export const isInGitRepository = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const cwd = nodePath.parse(absolutePath).dir;
    await execa("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      stdio: "ignore",
    });

    return true;
  } catch {
    return false;
  }
};

export const isPathIgnoredByGit = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    await execa("git", ["check-ignore", absolutePath]);
    return true;
  } catch {
    return false;
  }
};
