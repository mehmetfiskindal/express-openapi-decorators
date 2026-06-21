/**
 * JSON output formatter for the CLI.
 * Produces a deterministic, pretty-printed string with 2-space indent
 * so diffs in source control stay readable.
 */
export function formatJson(document: unknown): string {
  return JSON.stringify(document, null, 2) + '\n';
}
