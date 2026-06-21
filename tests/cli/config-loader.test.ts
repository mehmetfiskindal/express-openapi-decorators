import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveConfigPath, loadConfig } from '../../src/cli/config-loader';
import { writeFileEnsuringDir, pathExistsSync, isFileSync } from '../../src/cli/fs-utils';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

function makeTempDir(): string {
  const dir = join(tmpdir(), `eod-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('CLI: config-loader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  it('resolveConfigPath joins relative paths to cwd', () => {
    const abs = resolveConfigPath('./openapi.config.ts', tempDir);
    expect(abs.startsWith(tempDir)).toBe(true);
    expect(abs.endsWith('openapi.config.ts')).toBe(true);
  });

  it('resolveConfigPath leaves absolute paths alone', () => {
    const abs = resolveConfigPath('/abs/path/cfg.js');
    expect(abs).toBe('/abs/path/cfg.js');
  });

  it('fs-utils helpers report existence correctly', () => {
    const f = join(tempDir, 'exists.txt');
    writeFileSync(f, 'hi');
    expect(pathExistsSync(f)).toBe(true);
    expect(isFileSync(f)).toBe(true);
    expect(pathExistsSync(join(tempDir, 'nope.txt'))).toBe(false);
    expect(isFileSync(join(tempDir, 'nope.txt'))).toBe(false);
  });

  it('writeFileEnsuringDir creates parent directories', async () => {
    const target = join(tempDir, 'a', 'b', 'c.txt');
    await writeFileEnsuringDir(target, 'hello');
    expect(pathExistsSync(target)).toBe(true);
  });

  it('loadConfig errors on missing file', async () => {
    await expect(loadConfig({ configPath: '/does/not/exist.ts' })).rejects.toThrow(
      /not found/
    );
  });

  it('loadConfig errors when file has no default export', async () => {
    const f = join(tempDir, 'no-default.js');
    writeFileSync(f, 'const x = 1; module.exports = x;');
    await expect(loadConfig({ configPath: f })).rejects.toThrow(
      /must export a plain object or a function/
    );
  });

  it('loadConfig loads a plain object default export', async () => {
    const f = join(tempDir, 'plain.js');
    writeFileSync(
      f,
      `module.exports = { title: 'T', version: '1', controllers: [] };`
    );
    const { config } = await loadConfig({ configPath: f });
    expect(config.title).toBe('T');
    expect(config.version).toBe('1');
  });

  it('loadConfig awaits a function default export', async () => {
    const f = join(tempDir, 'fn.js');
    writeFileSync(
      f,
      `module.exports = async () => ({ title: 'Fn', version: '2', controllers: [] });`
    );
    const { config } = await loadConfig({ configPath: f });
    expect(config.title).toBe('Fn');
  });

  it('loadConfig surfaces factory errors', async () => {
    const f = join(tempDir, 'broken.js');
    writeFileSync(
      f,
      `module.exports = () => { throw new Error('boom'); };`
    );
    await expect(loadConfig({ configPath: f })).rejects.toThrow(/boom/);
  });

  // cleanup
  afterEachCleanup();
});

function afterEachCleanup() {
  // no-op; per-test cleanup handled by the suite's tempdir strategy
}
