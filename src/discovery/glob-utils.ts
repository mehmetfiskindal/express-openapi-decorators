/**
 * Zero-dependency glob matcher and file walker.
 * Replaces external dependency `fast-glob`.
 */
import { readdir, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';

/**
 * Convert a glob pattern (e.g. "src/**\/*.controller.ts" or "*.js") to a RegExp.
 */
export function globToRegExp(pattern: string): RegExp {
  // Normalize backslashes
  let p = pattern.replace(/\\/g, '/');
  if (p.startsWith('./')) {
    p = p.slice(2);
  }

  let regexStr = '';
  for (let i = 0; i < p.length; i++) {
    const char = p[i]!;
    if (char === '*') {
      if (p[i + 1] === '*') {
        if (p[i + 2] === '/') {
          regexStr += '(?:.*\\/)?';
          i += 2;
        } else {
          regexStr += '.*';
          i++;
        }
      } else {
        regexStr += '[^/]*';
      }
    } else if (char === '?') {
      regexStr += '[^/]';
    } else if (['.', '+', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'].includes(char)) {
      regexStr += '\\' + char;
    } else {
      regexStr += char;
    }
  }

  return new RegExp(`^${regexStr}$`);
}

export interface FindFilesOptions {
  cwd: string;
  ignore?: string[];
}

/**
 * Recursively find all files in cwd matching patterns and not matching ignore.
 */
export async function findMatchingFiles(
  patterns: string | string[],
  options: FindFilesOptions
): Promise<string[]> {
  const cwd = resolve(options.cwd);
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const positivePatterns = patternList.filter((p) => !p.startsWith('!'));
  const negativePatterns = [
    ...(options.ignore ?? []),
    ...patternList.filter((p) => p.startsWith('!')).map((p) => p.slice(1)),
  ];

  const positiveRegexes = positivePatterns.map((p) => globToRegExp(p));
  const negativeRegexes = negativePatterns.map((p) => globToRegExp(p));

  const directFiles: string[] = [];
  const wildcardPatterns: string[] = [];

  for (const p of positivePatterns) {
    if (!p.includes('*') && !p.includes('?')) {
      const abs = isAbsolute(p) ? p : resolve(cwd, p);
      try {
        const s = await stat(abs);
        if (s.isFile()) {
          directFiles.push(abs);
        }
      } catch {
        // file doesn't exist
      }
    } else {
      wildcardPatterns.push(p);
    }
  }

  const collected: string[] = [...directFiles];

  if (wildcardPatterns.length > 0) {
    async function walk(currentDir: string): Promise<void> {
      let entries;
      try {
        entries = await readdir(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = resolve(currentDir, entry.name);
        const relPath = relative(cwd, fullPath).replace(/\\/g, '/');

        // Check if ignored
        const isIgnored = negativeRegexes.some(
          (re) => re.test(relPath) || re.test(entry.name) || re.test(`**/${entry.name}/**`)
        );
        if (isIgnored) {
          continue;
        }

        if (entry.isDirectory()) {
          // Skip node_modules or dist unless explicitly targeted
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const isMatch = positiveRegexes.some((re) => re.test(relPath) || re.test(entry.name));
          if (isMatch) {
            collected.push(fullPath);
          }
        }
      }
    }

    await walk(cwd);
  }

  return Array.from(new Set(collected));
}
