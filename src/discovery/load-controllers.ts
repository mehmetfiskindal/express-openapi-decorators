/**
 * Auto controller discovery — glob for controller files, dynamically
 * import them via `tsx`, and return an array of classes decorated with
 * `@Controller`.
 *
 * Designed to be called from a user `openapi.config.ts`:
 *
 *   import { loadControllers } from '@developersailor/express-openapi-decorators';
 *   export default {
 *     title: 'My API',
 *     version: '1.0.0',
 *     controllers: await loadControllers('src/controllers/<star><star>/<star>.controller.ts'),
 *   };
 *
 * (The literal pattern uses a single-star single-star single-star
 *  glob so the JSDoc parser doesn't terminate on the `*`.)
 */
import fg from 'fast-glob';
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath, isAbsolute } from 'node:path';
import { metadataStorage } from '../metadata/metadata-storage.js';
import { pathExistsSync, isFileSync } from '../cli/fs-utils.js';

export interface LoadControllersOptions {
  /** Glob pattern(s) to match controller files. */
  pattern?: string | string[];
  /** Working directory (default: process.cwd()). */
  cwd?: string;
  /** Glob patterns to ignore (default: node_modules, dist). */
  ignore?: string[];
  /** Return only classes decorated with @Controller. Default: true. */
  decoratedOnly?: boolean;
}

/**
 * Best-effort dynamic import for a single file. Uses tsx for .ts files
 * and the native loader for .js / .mjs / .cjs.
 */
async function importFile(filePath: string): Promise<unknown> {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    try {
      const tsx = (await import('tsx/esm/api')) as {
        tsImport: (p: string, opts?: unknown) => Promise<unknown>;
      };
      return tsx.tsImport(filePath, { parentURL: pathToFileURL(filePath).href });
    } catch (err) {
      throw new Error(
        'Loading TypeScript files requires the `tsx` package.\n' +
          'Install it as a dev dependency: `npm install -D tsx`\n' +
          `Underlying error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  return import(pathToFileURL(filePath).href);
}

/**
 * Walk an object looking for class constructors. This is a defensive
 * helper: when a user re-exports a controller through a barrel file,
 * the actual class can be wrapped in `{ default: Class }` or
 * `{ Controller: Class }` or even deeper.
 */
function* collectClasses(value: unknown, seen: Set<object> = new Set()): Generator<unknown> {
  if (value === null || value === undefined) return;
  if (typeof value !== 'object' && typeof value !== 'function') return;

  if (seen.has(value as object)) return;
  seen.add(value as object);

  if (typeof value === 'function') {
    // Class constructors are functions. `toString().startsWith('class')`
    // is a reliable ES2015+ heuristic.
    if (/^\s*class\s/.test((value as Function).toString())) {
      yield value;
    }
    return;
  }

  // Object — recurse into properties
  for (const key of Object.keys(value as Record<string, unknown>)) {
    // Don't recurse into known framework metadata keys
    if (key === '__esModule') continue;
    yield* collectClasses((value as Record<string, unknown>)[key], seen);
  }
}

/**
 * Discover controller classes from a glob pattern. Returns classes
 * that are decorated with `@Controller()` when `decoratedOnly` is true
 * (the default), or all exported class constructors otherwise.
 *
 * The pattern can be supplied either as the first positional argument
 * or as `options.pattern`. The positional form is preserved for
 * backward compatibility.
 */
export async function loadControllers(
  patternOrOptions?: string | string[] | LoadControllersOptions,
  optionsArg: LoadControllersOptions = {}
): Promise<Function[]> {
  // Normalise the two calling conventions
  let pattern: string | string[] | undefined;
  let options: LoadControllersOptions = optionsArg;
  if (typeof patternOrOptions === 'string' || Array.isArray(patternOrOptions)) {
    pattern = patternOrOptions;
  } else if (patternOrOptions && typeof patternOrOptions === 'object') {
    options = patternOrOptions;
    pattern = options.pattern;
  }

  if (!pattern || (Array.isArray(pattern) && pattern.length === 0)) {
    throw new Error('loadControllers: a glob `pattern` is required.');
  }

  const cwd = options.cwd ?? process.cwd();
  const decoratedOnly = options.decoratedOnly ?? true;
  const ignore = options.ignore ?? ['**/node_modules/**', '**/dist/**'];

  const patterns = Array.isArray(pattern) ? pattern : [pattern];

  // Resolve all patterns into absolute file paths
  const files = await fg(patterns, {
    cwd,
    ignore,
    absolute: true,
    onlyFiles: true,
  });

  if (files.length === 0) {
    return [];
  }

  // Import each file. We collect classes from every import and dedupe
  // by Function reference at the end.
  const collected: Function[] = [];

  for (const file of files) {
    // Make sure the file still exists at the absolute path
    const absPath = isAbsolute(file) ? file : resolvePath(cwd, file);
    if (!pathExistsSync(absPath) || !isFileSync(absPath)) {
      continue;
    }

    let mod: unknown;
    try {
      mod = await importFile(absPath);
    } catch {
      // Skip files that fail to load — they may be unrelated to
      // controllers (types, helpers, etc.).
      continue;
    }

    for (const cls of collectClasses(mod)) {
      if (typeof cls !== 'function') continue;
      if (decoratedOnly && !metadataStorage.findController(cls as Function)) {
        continue;
      }
      collected.push(cls as Function);
    }
  }

  // Dedupe by reference. If the same class was imported twice (e.g.
  // via two barrel files) we'd otherwise generate the schema twice.
  const seen = new Set<Function>();
  const unique: Function[] = [];
  for (const c of collected) {
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(c);
    }
  }

  return unique;
}

// Re-export the path resolver for users who want to compose their
// own discovery logic.
export function resolvePatternPath(pattern: string, cwd: string = process.cwd()): string {
  return isAbsolute(pattern) ? pattern : resolvePath(cwd, pattern);
}
