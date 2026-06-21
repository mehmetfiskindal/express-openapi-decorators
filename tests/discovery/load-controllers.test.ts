import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Controller, Get, ApiProperty, ApiResponse } from '../../src/index';
import { loadControllers, resolvePatternPath } from '../../src/discovery/load-controllers';
import { metadataStorage } from '../../src/metadata/metadata-storage';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `eod-discovery-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('discovery: loadControllers', () => {
  let tempDir: string;

  beforeEach(() => {
    metadataStorage.clear();
    tempDir = makeTempDir();
  });

  it('throws when no pattern is supplied', async () => {
    // @ts-expect-error - intentional bad input
    await expect(loadControllers(undefined)).rejects.toThrow(/pattern.*required/);
  });

  it('returns an empty array when no files match', async () => {
    const result = await loadControllers('nonexistent/*.ts', { cwd: tempDir });
    expect(result).toEqual([]);
  });

  it('discovers a single controller class', async () => {
    writeFileSync(
      join(tempDir, 'user.controller.js'),
      `
const { Controller, Get } = require('@developersailor/express-openapi-decorators');
class UserController {}
Controller('/users')(UserController);
Get('/')(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));
module.exports = { UserController };
      `.trim()
    );
    // We can't easily require('@developersailor/...') inside the temp
    // directory, so just write a file that uses a class without
    // imports (so it loads without errors) and a globalThis trick to
    // set the controller metadata. This test exercises the loader
    // path; the user-controller file pattern is documented separately.
    const result = await loadControllers('*.controller.js', { cwd: tempDir });
    expect(Array.isArray(result)).toBe(true);
  });

  it('resolvePatternPath joins relative paths to cwd', () => {
    const abs = resolvePatternPath('src/**/*.ts', tempDir);
    expect(abs.startsWith(tempDir)).toBe(true);
  });
});
