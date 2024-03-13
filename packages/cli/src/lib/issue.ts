import pkg from "@pkg";
import stringify from "fast-json-stable-stringify";
import nodeCrypto from "node:crypto";
import { getBorderCharacters, table } from "table";
import { z } from "zod";
import { getLogger } from "@/lib/logger";

export const IssueSchema = z
  .object({
    /** The issue id. */
    id: z.string().describe("The issue id."),
    /** The severity of the issue. */
    severity: z.enum(["warn", "error"]).describe("The severity of the issue."),
    /** The issue message. */
    message: z.string().describe("The issue message."),
    /** The function to fix the issue */
    fix: z.function().optional().describe("The function to fix the issue."),
  })
  .describe("An issue.");

export type Issue = z.infer<typeof IssueSchema>;

// The issue store used during the execution.
const GLOBAL_ISSUES: Issue[] = [];

type IssueInputs = Partial<Omit<Issue, "id">>;

/** The issues filters. */
type IssuesFilters = {
  /** The severity of the issue to filter. */
  severity?: Issue["severity"] | Issue["severity"][];
};

export const issues = {
  /** Generate an issue without adding it to the collector. */
  gen: (issue: IssueInputs): Issue => {
    const issueData: Omit<Issue, "id"> = {
      severity: "error",
      message: "An unknown error occurred",
      ...issue,
    };

    const { fix, ...serializableData } = issueData;

    const id = nodeCrypto
      .createHash("sha256")
      .update(stringify(serializableData))
      .digest("hex");

    return {
      id,
      fix,
      ...serializableData,
    };
  },

  /** Add an issue to the collector. */
  add: (issue: IssueInputs) => {
    const issueData = issues.gen(issue);

    if (!GLOBAL_ISSUES.find(({ id }) => id === issueData.id)) {
      GLOBAL_ISSUES.push(issueData);
    }

    return issues;
  },

  /** Add an error object to the collector. */
  error: (error: unknown) => {
    issues.add({
      message: error instanceof Error ? error.message : String(error),
      severity: "error", // Error always have a severity of "error".
    });

    return issues;
  },

  /** Print the issues. */
  print: async (filters: IssuesFilters = {}) => {
    const { default: chalk } = await import("chalk");
    const { logger } = getLogger();
    const filteredIssues = issues.get(filters);
    const counts = issues.counts(filters);
    const msgColor = counts.errors ? chalk.red.bold : chalk.yellow.bold;

    if (counts.total === 0) {
      logger.log(chalk.dim("No issues found"));
      return issues;
    }

    const rows: [string, string][] = [];

    filteredIssues.forEach((issue) => {
      const fix = issue.fix ? "⚒ " : "";
      const issueColor = issue.severity === "error" ? chalk.red : chalk.yellow;

      rows.push([issueColor(`${fix}${issue.severity}`), issue.message]);
    });

    logger.log(msgColor("The following issues were found.\n"));

    logger.log(
      table(rows, {
        border: getBorderCharacters("void"),
        columnDefault: {
          paddingLeft: 0,
          paddingRight: 0,
          wrapWord: true,
        },
        columns: [
          { width: 10, wrapWord: true },
          { width: 70, wrapWord: true },
        ],
        drawHorizontalLine: () => false,
      }),
    );

    logger.log(
      msgColor(
        `${counts.errors ? "✖" : "⚠"} ${counts.total} issue${
          counts.total > 1 ? "s" : ""
        } (${counts.errors} error${counts.errors > 1 ? "s" : ""}, ${
          counts.warnings
        } warning${counts.warnings > 1 ? "s" : ""})`,
      ),
    );

    counts.fixes &&
      logger.log(
        msgColor(
          `⚒ ${counts.fixes} fix${
            counts.fixes > 1 ? "es" : ""
          } available with "${chalk.italic("dotsecret fix")}"`,
        ),
      );

    // FIXME: Find a wait to add unknown issues
    const unknownIssues = { counts: { total: 0 } };

    if (unknownIssues.counts.total) {
      logger.log(
        msgColor(
          `\n${unknownIssues.counts.total} unknown issue${
            unknownIssues.counts.total > 1 ? "s" : ""
          } found. Please report at ${chalk.underline(pkg.bugs.url)}`,
        ),
      );
    }

    return issues;
  },

  /** Return the issues counts. */
  counts: (filters: IssuesFilters = {}) => {
    const filteredIssues = issues.get(filters);

    return {
      total: filteredIssues.length,
      errors: filteredIssues.filter(({ severity }) => severity === "error")
        .length,
      warnings: filteredIssues.filter(({ severity }) => severity === "warn")
        .length,
      fixes: filteredIssues.filter(({ fix }) => !!fix).length,
    };
  },

  /** Return the issues. */
  get: ({ severity }: IssuesFilters = {}) => {
    const severities = (Array.isArray(severity) ? severity : [severity]).filter(
      Boolean,
    );

    return GLOBAL_ISSUES.filter(
      ({ severity: issueSeverity }) =>
        !severities.length || severities.includes(issueSeverity),
    );
  },
};
