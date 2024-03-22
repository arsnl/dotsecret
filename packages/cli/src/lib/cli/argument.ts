import { Argument } from "commander";
import { parserGlobPatterns } from "./parser";

export type ArgumentGlobPatterns = ReturnType<typeof parserGlobPatterns>;

export const argumentGlobPatterns = new Argument(
  "glob-patterns",
  "Glob patterns filter",
).argParser(parserGlobPatterns);
