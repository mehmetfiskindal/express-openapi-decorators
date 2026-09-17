/**
 * Zero-dependency CLI argument parser for `express-openapi-decorators`.
 * Replaces external dependency `cac`.
 */
import { runGenerate } from './commands/generate.js';
import { runValidate } from './commands/validate.js';

export interface CliParsedArgs {
  command?: string | undefined;
  args: string[];
  options: Record<string, string | boolean>;
}

export function parseArgs(rawArgv: string[]): CliParsedArgs {
  // Strip node and script path if raw process.argv is passed
  let args = rawArgv;
  if (args.length >= 2 && (args[0]?.endsWith('node') || args[0]?.endsWith('node.exe') || args[1]?.includes('cli.js'))) {
    args = args.slice(2);
  }

  const positional: string[] = [];
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--version' || arg === '-v') {
      options.version = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const keyAndVal = arg.slice(2);
      const eqIdx = keyAndVal.indexOf('=');
      if (eqIdx !== -1) {
        const key = keyAndVal.slice(0, eqIdx);
        const val = keyAndVal.slice(eqIdx + 1);
        options[key] = val;
      } else {
        const nextArg = args[i + 1];
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          options[keyAndVal] = nextArg;
          i++;
        } else {
          options[keyAndVal] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      const key = arg.slice(1);
      const nextArg = args[i + 1];
      if (nextArg !== undefined && !nextArg.startsWith('-')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  const command = positional[0];
  const commandArgs = positional.slice(1);

  return {
    command,
    args: commandArgs,
    options,
  };
}

const HELP_TEXT = `
openapi-decorators/0.1.0

Usage:
  $ openapi-decorators <command> [options]

Commands:
  generate <config> [output]  Generate an OpenAPI document from a config file
  validate <config>           Validate a config file by generating a document in memory

For more info, run any command with the \`--help\` flag:
  $ openapi-decorators generate --help
  $ openapi-decorators validate --help

Options:
  -v, --version  Display version number
  -h, --help     Display this message
`.trim();

const GENERATE_HELP = `
openapi-decorators generate <config> [output]

Generate an OpenAPI document from a config file

Options:
  --format <format>    Output format: json or yaml (default: json)
  --openapi <version>  OpenAPI version: 3.0.3 or 3.1.0 (default: 3.1.0)
  -h, --help           Display this message
`.trim();

const VALIDATE_HELP = `
openapi-decorators validate <config>

Validate a config file by generating a document in memory

Options:
  --openapi <version>  OpenAPI version: 3.0.3 or 3.1.0 (default: 3.1.0)
  -h, --help           Display this message
`.trim();

export function outputHelp(command?: string): void {
  if (command === 'generate') {
    // eslint-disable-next-line no-console
    console.log(GENERATE_HELP);
  } else if (command === 'validate') {
    // eslint-disable-next-line no-console
    console.log(VALIDATE_HELP);
  } else {
    // eslint-disable-next-line no-console
    console.log(HELP_TEXT);
  }
}

export function outputVersion(): void {
  // eslint-disable-next-line no-console
  console.log('openapi-decorators/0.1.0');
}

/**
 * Run the CLI parser and execute matched command.
 */
export async function runCli(argv: string[]): Promise<void> {
  try {
    const parsed = parseArgs(argv);

    if (parsed.options.version) {
      outputVersion();
      return;
    }

    if (parsed.options.help && !parsed.command) {
      outputHelp();
      return;
    }

    if (!parsed.command) {
      outputHelp();
      return;
    }

    if (parsed.command === 'generate') {
      if (parsed.options.help) {
        outputHelp('generate');
        return;
      }
      const config = parsed.args[0];
      if (!config) {
        throw new Error('Missing required argument: <config>');
      }
      const output = parsed.args[1];
      const format = String(parsed.options.format ?? 'json');
      const openapi = String(parsed.options.openapi ?? '3.1.0');

      await runGenerate({
        configPath: config,
        outputPath: output,
        format,
        openapi,
      });
      return;
    }

    if (parsed.command === 'validate') {
      if (parsed.options.help) {
        outputHelp('validate');
        return;
      }
      const config = parsed.args[0];
      if (!config) {
        throw new Error('Missing required argument: <config>');
      }
      const openapi = String(parsed.options.openapi ?? '3.1.0');

      await runValidate({
        configPath: config,
        openapi,
      });
      return;
    }

    throw new Error(`Unknown command "${parsed.command}". Run with --help to see available commands.`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      'openapi-decorators: ' +
        (err instanceof Error ? err.message : String(err))
    );
    process.exitCode = 1;
  }
}
