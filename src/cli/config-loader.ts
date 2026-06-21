/**
 * Load and evaluate a user-supplied config file.
 *
 * Supports two shapes:
 *  1. Default export is a plain object: `export default { title, version, controllers: [...] }`
 *  2. Default export is a (possibly async) function: `export default async () => ({...})`
 *
 * For TypeScript configs we use `tsx/esm/api`'s `tsImport()` to evaluate
 * the file in-process. This keeps the CLI fast (no separate subprocess)
 * and lets us surface type errors via the user's own TypeScript config.
 *
 * For JS configs we use the platform's native `import()`.
 */
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath, isAbsolute } from 'node:path';
import { pathExistsSync } from './fs-utils.js';

export interface LoadedConfig {
  /** Absolute path to the resolved config file. */
  configPath: string;
  /** The evaluated configuration object. */
  config: Record<string, unknown>;
}

export interface LoadConfigOptions {
  /** Absolute or relative path to the config file. */
  configPath: string;
  /** Working directory to resolve relative paths from. Default: process.cwd() */
  cwd?: string;
}

/**
 * Normalise the path to an absolute, resolved-to-cwd location.
 */
export function resolveConfigPath(configPath: string, cwd: string = process.cwd()): string {
  const abs = isAbsolute(configPath) ? configPath : resolvePath(cwd, configPath);
  return abs;
}

/**
 * Dynamically import a user config file.
 *
 * Strategy:
 *  - For .js / .mjs / .cjs files, use the native loader.
 *  - For .ts / .tsx files, prefer the tsx ESM hook installed by the
 *    bin shim (via `node --import tsx/esm`). A native `import()` goes
 *    through the hook and transforms the .ts file on the fly.
 *  - If the hook isn't installed and tsx is available, fall back to
 *    `tsx/esm/api`'s `tsImport()`.
 *  - Otherwise, give a clear error telling the user to install tsx.
 */
async function dynamicImport(configPath: string): Promise<unknown> {
  if (!pathExistsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const fileUrl = pathToFileURL(configPath).href;

  // Try a native import first. When tsx is installed as a global
  // hook (`--import tsx/esm`), this transparently transforms .ts
  // files. When the hook isn't installed, .ts files fail with a
  // parser error and we fall back to tsx's programmatic API.
  try {
    return await import(fileUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTs = configPath.endsWith('.ts') || configPath.endsWith('.tsx');
    if (!isTs) throw err;

    // Try tsx's programmatic API as a last resort.
    try {
      const tsx = (await import('tsx/esm/api')) as {
        tsImport: (p: string, opts?: unknown) => Promise<unknown>;
      };
      return await tsx.tsImport(configPath, { parentURL: fileUrl });
    } catch (tsxErr) {
      throw new Error(
        'Failed to load TypeScript config. Install `tsx` and run the CLI via ' +
          '`npx express-openapi-decorators` or `node --import tsx/esm <bundle>`.\n' +
          'Original error: ' +
          message +
          '\ntsx error: ' +
          (tsxErr instanceof Error ? tsxErr.message : String(tsxErr))
      );
    }
  }
}

/**
 * Extract the default export from a CommonJS-style module object.
 * `import()` wraps CJS modules in `{ default: module.exports }`, so we
 * unwrap when the value is a single non-namespace object.
 */
function unwrapDefault(mod: unknown): unknown {
  if (mod && typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)) {
    return (mod as Record<string, unknown>).default;
  }
  return mod;
}

/**
 * Evaluate a config file and return its resolved configuration.
 * Throws with a one-line user-facing message on failure.
 */
export async function loadConfig(options: LoadConfigOptions): Promise<LoadedConfig> {
  const configPath = resolveConfigPath(options.configPath, options.cwd);

  let mod: unknown;
  try {
    mod = await dynamicImport(configPath);
  } catch (err) {
    throw new Error(
      `Failed to load config file "${configPath}": ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  let raw: unknown = unwrapDefault(mod);

  // Allow default export to be a factory function (sync or async)
  if (typeof raw === 'function') {
    try {
      raw = await (raw as (...args: unknown[]) => unknown)();
    } catch (err) {
      throw new Error(
        `Config factory threw: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(
      `Config file "${configPath}" must export a plain object or a function that returns one.`
    );
  }

  return { configPath, config: raw as Record<string, unknown> };
}
