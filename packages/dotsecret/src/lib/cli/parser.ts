import { InvalidArgumentError } from "commander";
import { getAbsolutePath, isFileExists, isPathExists } from "@/lib/utils";

export const parserPathExists = (value: string) => {
  const absolutePath = getAbsolutePath(value);
  const pathExists = isPathExists(absolutePath);

  if (!pathExists) {
    throw new InvalidArgumentError(
      `The path "${absolutePath}" does not exist.`,
    );
  }
  return absolutePath;
};

export const parserFileExists = (value: string) => {
  const absolutePath = getAbsolutePath(value);
  const fileExists = isFileExists(absolutePath);

  if (!fileExists) {
    throw new InvalidArgumentError(
      `The file "${absolutePath}" does not exist.`,
    );
  }

  return absolutePath;
};

export const parserGlobPatterns = (value: string) =>
  value
    .split(" ")
    .map((pattern) => pattern.trim())
    .filter(Boolean);
