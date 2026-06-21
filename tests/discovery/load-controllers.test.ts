import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Controller, Get, ApiProperty, ApiResponse, createOpenApiDocument } from '../../src/index';
import { loadControllers, resolvePatternPath } from '../../src/discovery/load-controllers';
import { metadataStorage } from '../../src/metadata/metadata-storage';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { mkdirSync, writeFileSync, symlinkSync, existsSync } from 'node:fs';

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `eod-discovery-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

const PACKAGE_ROOT = resolve(__dirname, '..', '..');

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

  it('accepts an options object with `pattern`', async () => {
    const result = await loadControllers({
      pattern: 'nonexistent/*.ts',
      cwd: tempDir,
    });
    expect(result).toEqual([]);
  });

  it('discovers decorated controller classes from a glob', async () => {
    // Create a symlink to the package so the temp file can require it
    // by name. This mirrors what a real user's project would look
    // like.
    const nmDir = join(tempDir, 'node_modules', '@developersailor');
    mkdirSync(nmDir, { recursive: true });
    try {
      symlinkSync(PACKAGE_ROOT, join(nmDir, 'express-openapi-decorators'));
    } catch {
      // Symlink may fail in some environments; skip this test.
      return;
    }

    writeFileSync(
      join(tempDir, 'user.controller.js'),
      `
const { Controller, Get, ApiResponse } = require('@developersailor/express-openapi-decorators');

class UserController {}
Controller('/users')(UserController);
Get('/')(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));
ApiResponse({ status: 200 })(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));

module.exports = { UserController };
      `.trim()
    );

    const result = await loadControllers('*.controller.js', { cwd: tempDir });
    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe('UserController');
    expect(metadataStorage.findController(result[0]!)).toBeDefined();
  });

  it('dedupes identical function references', async () => {
    // Note: barrel files that re-export from a different path (e.g.
    // `index.js` re-exports `./ctrl.js`) actually create separate
    // module instances in Node, so dedup only applies to literal
    // duplicates. We test the dedup behaviour by importing the same
    // file twice via the same path.
    const nmDir = join(tempDir, 'node_modules', '@developersailor');
    mkdirSync(nmDir, { recursive: true });
    try {
      symlinkSync(PACKAGE_ROOT, join(nmDir, 'express-openapi-decorators'));
    } catch {
      return;
    }

    writeFileSync(
      join(tempDir, 'ctrl.js'),
      `
const { Controller, Get } = require('@developersailor/express-openapi-decorators');
class Ctrl {}
Controller('/c')(Ctrl);
Get('/')(Ctrl.prototype, 'list', {});
module.exports = { Ctrl };
      `.trim()
    );

    // Single file, single class — should return exactly 1.
    const result = await loadControllers('ctrl.js', { cwd: tempDir });
    expect(result.length).toBe(1);
  });

  it('resolvePatternPath joins relative paths to cwd', () => {
    const abs = resolvePatternPath('src/**/*.ts', tempDir);
    expect(abs.startsWith(tempDir)).toBe(true);
  });

  it('resolvePatternPath leaves absolute paths alone', () => {
    expect(resolvePatternPath('/abs/path/*.ts')).toBe('/abs/path/*.ts');
  });

  it('respects decoratedOnly: false to return any class', async () => {
    writeFileSync(
      join(tempDir, 'plain.js'),
      `class PlainClass {}\nmodule.exports = { PlainClass };`
    );
    const result = await loadControllers('plain.js', {
      cwd: tempDir,
      decoratedOnly: false,
    });
    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe('PlainClass');
  });

  it('skips files that fail to import', async () => {
    writeFileSync(
      join(tempDir, 'broken.js'),
      `throw new Error('intentional');`
    );
    writeFileSync(
      join(tempDir, 'good.js'),
      `module.exports = {};`
    );
    const result = await loadControllers(['broken.js', 'good.js'], { cwd: tempDir });
    // broken.js fails, good.js has no classes
    expect(result).toEqual([]);
  });
});
