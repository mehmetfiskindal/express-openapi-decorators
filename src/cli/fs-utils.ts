/**
 * Tiny filesystem helpers used by the CLI.
 * Kept as a separate module to make the rest of the CLI test-friendly
 * and free of side effects.
 */
import { existsSync, statSync } from 'node:fs';
import { writeFile as fsWriteFile, mkdir as fsMkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export function pathExistsSync(p: string): boolean {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

export function isFileSync(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

export function isDirectorySync(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export async function writeFileEnsuringDir(path: string, content: string): Promise<void> {
  await fsMkdir(dirname(path), { recursive: true });
  await fsWriteFile(path, content, 'utf8');
}
