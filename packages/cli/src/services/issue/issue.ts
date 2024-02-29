import pkg from "@pkg";
import stringify from "fast-json-stable-stringify";
import nodeCrypto from "node:crypto";
import { getBorderCharacters, table } from "table";
import { z } from "zod";
import chalk from "@/esm-only/chalk";
import { getLogger } from "@/services/logger";

export const SCOPES = [
  "store",
  "config",
  "secret",
  "token",
  "template",
  "vault",
  "unknown",
] as const;

export const IssueSchema = z
  .object({
    /** The issue id. */
    id: z.string().describe("The issue id."),
    /** The scope of the issue. */
    scope: z.enum(SCOPES).describe("The scope of the issue."),
    /** The severity of the issue. */
    severity: z.enum(["warn", "error"]).describe("The severity of the issue."),
    /** The issue message. */
    message: z.string().describe("The issue message."),
    /** The function to fix the issue */
    fix: z.function().optional().describe("The function to fix the issue."),
    /** The source of the issue. */
    source: z.string().optional().describe("The source of the issue."),
  })
  .describe("An issue.");

export type Issue = z.infer<typeof IssueSchema>;

export const IssuesSchema = z
  .array(IssueSchema)
  .default([])
  .describe("The issues encountered.");

export type Issues = z.infer<typeof IssuesSchema>;

export const IssuesCountsSchema = z
  .object({
    /** The number of issues. */
    total: z.number().describe("The number of issues."),
    /** The number of errors. */
    errors: z.number().describe("The number of errors."),
    /** The number of warnings. */
    warnings: z.number().describe("The number of warnings."),
    /** The number of fixes. */
    fixes: z.number().describe("The number of fixes."),
  })
  .default({
    total: 0,
    errors: 0,
    warnings: 0,
    fixes: 0,
  })
  .describe("The issues counts.");

export type IssuesCounts = z.infer<typeof IssuesCountsSchema>;

export const IssuesCollectionSchema = z
  .object({
    /** The issues. */
    issues: IssuesSchema.describe("The issues."),
    /** The issues counts. */
    counts: IssuesCountsSchema.describe("The issues counts."),
  })
  .default({})
  .describe("The issues collection.");

export type IssuesCollection = z.infer<typeof IssuesCollectionSchema>;

export class IssuesCollectorError extends Error {
  issuesCollection: IssuesCollection;

  constructor(issuesCollection: IssuesCollection) {
    super("Issues encountered");
    this.name = "IssuesCollectorError";
    this.issuesCollection = issuesCollection;
  }
}

// The issue store used during the execution.
const GLOBAL_ISSUES: Issues = [];

export const getIssuesCollector = (
  defaultIssue: Partial<Omit<Issue, "message" | "id" | "code">> = {},
) => {
  type IssueInputs = Partial<Omit<Issue, "id">>;

  /** Generate an issue without adding it to the collector. */
  const gen = (issue: IssueInputs): Issue => {
    const issueData: Omit<Issue, "id"> = {
      scope: "unknown",
      severity: "error",
      message: "An unknown error occurred",
      ...defaultIssue,
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
  };

  /** Add an issue to the collector. */
  const add = (issue: IssueInputs) => {
    const issueData = gen(issue);

    if (!GLOBAL_ISSUES.find(({ id }) => id === issueData.id)) {
      GLOBAL_ISSUES.push(issueData);
    }

    return collector;
  };

  /** Add an error to the collector. */
  const addError = (error: unknown) => {
    if (!(error instanceof IssuesCollectorError)) {
      add({
        message: error instanceof Error ? error.message : String(error),
        severity: "error", // Error always have a severity of "error".
      });
    }

    return collector;
  };

  type IssuesFilters = {
    scope?: Issue["scope"] | Issue["scope"][];
    severity?: Issue["severity"] | Issue["severity"][];
  };

  const filterIssues = ({ scope, severity }: IssuesFilters = {}) => {
    const scopes = (Array.isArray(scope) ? scope : [scope]).filter(Boolean);
    const severities = (Array.isArray(severity) ? severity : [severity]).filter(
      Boolean,
    );

    return GLOBAL_ISSUES.filter(
      ({ scope: issueScope, severity: issueSeverity }) =>
        (!scopes.length || scopes.includes(issueScope)) &&
        (!severities.length || severities.includes(issueSeverity)),
    );
  };

  /**
   * Print the issues.
   * If an optional scope or array of scopes are provided, the issues will be scoped to these scopes.
   */
  const print = (filters: IssuesFilters = {}) => {
    const { logger } = getLogger();
    const { counts, issues } = get(filters);
    const msgColor = counts.errors ? chalk.red.bold : chalk.yellow.bold;

    if (counts.total === 0) {
      logger.log(chalk.dim("No issues found"));
      return collector;
    }

    const header = [
      " ",
      chalk.bold("Scope"),
      chalk.bold("Severity"),
      chalk.bold("Message"),
      chalk.bold("Source"),
    ];

    const rows: [string, string, string, string, string][] = [];

    issues.forEach((issue) => {
      const fix = issue.fix ? chalk.dim("⚒") : " ";
      const issueColor = issue.severity === "error" ? chalk.red : chalk.yellow;

      rows.push([
        fix,
        chalk.dim(issue.scope),
        issueColor(issue.severity),
        issue.message,
        chalk.dim(issue.source || "n/a"),
      ]);
    });

    logger.log(msgColor("The following issues were found.\n"));

    logger.log(
      table([header, ...rows], {
        border: getBorderCharacters("void"),
        columnDefault: {
          paddingLeft: 0,
          paddingRight: 2,
          wrapWord: true,
        },
        columns: [
          {
            width: 1,
            wrapWord: true,
          },
          {
            wrapWord: true,
          },
          { width: 8, wrapWord: true },
          {
            width: 60,
            wrapWord: true,
          },
          {
            width: 50,
            wrapWord: true,
          },
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

    const unknownIssues = get({ scope: "unknown" });

    if (unknownIssues.counts.total) {
      logger.log(
        msgColor(
          `\n${unknownIssues.counts.total} unknown issue${
            unknownIssues.counts.total > 1 ? "s" : ""
          } found. Please report at ${chalk.underline(pkg.bugs.url)}`,
        ),
      );
    }

    return collector;
  };

  /**
   * Return the issues counts.
   * Total, errors, warnings and fixes.
   * If an optional scope or array of scopes are provided, the issues will be scoped to these scopes.
   */
  const counts = (filters: IssuesFilters = {}): IssuesCounts => {
    const issues = filterIssues(filters);

    return {
      total: issues.length,
      errors: issues.filter(({ severity }) => severity === "error").length,
      warnings: issues.filter(({ severity }) => severity === "warn").length,
      fixes: issues.filter(({ fix }) => !!fix).length,
    };
  };

  /**
   * Return the issues collection.
   * Issues array and counts.
   * If an optional scope or array of scopes are provided, the issues will be scoped to these scopes.
   */
  const get = (filters: IssuesFilters = {}): IssuesCollection => {
    const issues = filterIssues(filters);

    return {
      issues: [...issues],
      counts: counts(filters),
    };
  };

  /**
   * Return an error with the issues collection.
   * This error can be thrown to stop the execution.
   */
  const error = () => new IssuesCollectorError(get());

  const collector = {
    add,
    addError,
    gen,
    print,
    counts,
    get,
    error,
  };

  return collector;
};

export type IssuesCollector = ReturnType<typeof getIssuesCollector>;
