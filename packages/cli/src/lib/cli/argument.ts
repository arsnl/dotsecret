import { Argument } from "commander";
import { parserGlobPatterns } from "./parser";

export type ArgumentTemplates = ReturnType<typeof parserGlobPatterns>;

export const argumentTemplates = new Argument(
  "[templates]",
  "Templates glob patterns",
).argParser(parserGlobPatterns);
