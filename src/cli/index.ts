/**
 * `express-openapi-decorators` CLI entry point.
 *
 * Subcommands:
 *   generate  — produce an OpenAPI document from a user config file
 *   validate  — produce and validate a document without writing output
 *
 * The CLI is intentionally tiny: it delegates work to the existing
 * `createOpenApiDocument()` and to the user-provided config file
 * (which performs any controller discovery / setup work).
 */
import { cac } from 'cac';
import { runGenerate } from './commands/generate.js';
import { runValidate } from './commands/validate.js';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const cli = cac('express-openapi-decorators');

cli
  .command('generate <config> [output]', 'Generate an OpenAPI document from a config file')
  .option('--format <format>', 'Output format: json or yaml', { default: 'json' })
  .option('--openapi <version>', 'OpenAPI version: 3.0.3 or 3.1.0', { default: '3.1.0' })
  .action(async (config: string, output: string | undefined, options: { format: string; openapi: string }) => {
    await runGenerate({ configPath: config, outputPath: output, format: options.format, openapi: options.openapi });
  });

cli
  .command('validate <config>', 'Validate a config file by generating a document in memory')
  .option('--openapi <version>', 'OpenAPI version: 3.0.3 or 3.1.0', { default: '3.1.0' })
  .action(async (config: string, options: { openapi: string }) => {
    await runValidate({ configPath: config, openapi: options.openapi });
  });

cli.help();
cli.version('0.1.0');

/**
 * Run the CLI: parse argv, dispatch to the matched command, await its
 * result, and propagate any thrown error to a non-zero exit code.
 *
 * This wrapper is what the bin shim invokes. It is exported as
 * `run` so consumers can embed the CLI in larger scripts.
 */
export async function run(argv: string[]): Promise<void> {
  try {
    // Parse without running so we can grab the action's return value
    // and await it ourselves. cac's `parse(argv, { run: false })` is
    // synchronous and only sets the matched command.
    cli.parse(argv, { run: false });
    if (!cli.matchedCommandName) {
      // No command matched. Print help and exit 0.
      cli.outputHelp();
      return;
    }
    // `runMatchedCommand()` invokes the matched action and returns
    // its return value. For our async actions this is a Promise.
    const result = cli.runMatchedCommand();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      await result;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      'express-openapi-decorators: ' +
        (err instanceof Error ? err.message : String(err))
    );
    process.exitCode = 1;
  }
}

export default cli;

/**
 * Direct-invocation entry point.
 *
 * When this module is the program's entry point (i.e. `node
 * dist/cli/index.mjs generate ...`), the imported `import.meta.url`
 * matches `process.argv[1]`. In that case we kick off the CLI
 * ourselves; otherwise the file was imported and the caller is
 * responsible for calling `run()` themselves.
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
  // Run the CLI and propagate the exit code.
  run(process.argv).then(
    () => {
      process.exit(process.exitCode || 0);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error(
        'express-openapi-decorators: ' +
          (err instanceof Error ? err.message : String(err))
      );
      process.exit(1);
    }
  );
}

// Reference fileURLToPath so it isn't tree-shaken — useful for
// downstream tools that want to inspect the CLI's resolved entry.
void fileURLToPath;
