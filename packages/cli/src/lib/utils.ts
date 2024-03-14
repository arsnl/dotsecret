import nodeFs from "node:fs";
import nodePath from "node:path";

/**
 * Get the absolute path of a given path
 *
 * @param path The path to get the absolute path of
 * @param cwd The current working directory. Default: process.cwd()
 * @returns The absolute path
 */
export const getAbsolutePath = (path: string, cwd = process.cwd()) =>
  nodePath.isAbsolute(path) ? path : nodePath.resolve(cwd, path);

/**
 * Check if the path exists
 *
 * @param path The path to check
 * @returns true if the path exists, false otherwise
 */
export const isPathExists = (path: string) =>
  nodeFs.existsSync(getAbsolutePath(path));

/**
 * Check if the file exists
 *
 * @param path The path of the file to check
 * @returns true if the file exists, false otherwise
 */
export const isFileExists = (path: string) => {
  const absolutePath = getAbsolutePath(path);

  return isPathExists(absolutePath) && nodeFs.lstatSync(absolutePath).isFile();
};

/**
 * Get the last update of a file
 *
 * @param path The path of the file to get the last update of
 * @returns The last update of the file, or undefined if the file does not exist
 */
export const getFileLastUpdate = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const fileStats = await nodeFs.promises.stat(absolutePath);
    return fileStats.mtime;
  } catch {
    return undefined;
  }
};

/**
 * Get the content of a file as a string
 *
 * @param path The path of the file to get the content of
 * @returns The content of the file as a string, or undefined if the file does not exist
 */
export const getFileContent = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const fileContent = await nodeFs.promises.readFile(absolutePath, "utf-8");
    return fileContent;
  } catch {
    return undefined;
  }
};

/**
 * Delete a file
 *
 * @param path The path of the file to delete
 * @returns true if the file was deleted, false otherwise
 */
export const deleteFile = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    await nodeFs.promises.unlink(absolutePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get the permissions of a file
 *
 * @param path The path of the file to get the permissions of
 * @returns The permissions of the file, or undefined if the file does not exist
 */
export const getFilePermissions = async (path: string) => {
  const absolutePath = getAbsolutePath(path);

  try {
    const stat = await nodeFs.promises.stat(absolutePath);
    // eslint-disable-next-line no-bitwise -- We need to use bitwise operators here
    return (stat.mode & 0o777).toString(8);
  } catch {
    return undefined;
  }
};

/**
 * Set the permissions of a file
 *
 * @param path The path of the file to set the permissions of
 * @param mode The permissions to set (eg. 0o755 or "755")
 * @returns true if the permissions were set, false otherwise
 */
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

/**
 * Check if the path is writeable
 *
 * @param path The path to check
 * @returns true if the path is writeable, false otherwise
 */
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

/**
 * Check if the path is in a git repository
 *
 * @param path The path to check
 * @returns true if the path is in a git repository, false otherwise
 */
export const isPathInGitRepository = async (path: string) => {
  const { execa } = await import("execa");
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

/**
 * Check if the path is ignored by git
 *
 * @param path The path to check
 * @returns true if the path is ignored by git, false otherwise
 */
export const isPathIgnoredByGit = async (path: string) => {
  const { execa } = await import("execa");
  const absolutePath = getAbsolutePath(path);

  try {
    await execa("git", ["check-ignore", absolutePath]);
    return true;
  } catch {
    return false;
  }
};
