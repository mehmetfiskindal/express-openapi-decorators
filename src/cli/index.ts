/**
 * `express-openapi-decorators` CLI entry point.
 * Zero-dependency CLI implementation.
 *
 * Subcommands:
 *   generate  — produce an OpenAPI document from a user config file
 *   validate  — produce and validate a document without writing output
 */
import { runCli, parseArgs, outputHelp, outputVersion } from './parser.js';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

export { parseArgs, outputHelp, outputVersion };

/**
 * Run the CLI: parse argv, dispatch to the matched command, await its
 * result, and propagate any thrown error to a non-zero exit code.
 *
 * This wrapper is what the bin shim invokes. It is exported as
 * `run` so consumers can embed the CLI in larger scripts.
 */
export async function run(argv: string[]): Promise<void> {
  await runCli(argv);
}

export default { run, parseArgs, outputHelp, outputVersion };

/**
 * Direct-invocation entry point.
 */
const isMain = (() => {
  try {
    const arg1 = process.argv[1];
    if (!arg1) return false;
    return pathToFileURL(arg1).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (isMain) {
  run(process.argv).then(
    () => {
      process.exit(process.exitCode || 0);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error(
        'openapi-decorators: ' +
          (err instanceof Error ? err.message : String(err))
      );
      process.exit(1);
    }
  );
}

void fileURLToPath;
