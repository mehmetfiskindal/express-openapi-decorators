import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `eod-cli-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('e2e: CLI', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  });

  it('generate command produces a JSON file from a JS config', () => {
    const configPath = join(tempDir, 'openapi.config.js');
    const outPath = join(tempDir, 'openapi.json');
    // Use a self-contained config: it does not import from the
    // package directly, so we don't need a node_modules setup. We
    // patch globalThis to register the metadata in the same module
    // graph the CLI will load.
    writeFileSync(
      configPath,
      `
// Self-contained: talk to the package's CJS bundle by absolute path
// so we don't need a local node_modules.
const path = require('node:path');
const distPath = path.resolve('${process.cwd()}/dist/index.js');
const { Controller, Get, ApiProperty, ApiResponse } = require(distPath);

class UserDto {}
ApiProperty({ type: String, example: 'u1' })(UserDto.prototype, 'id');

class UserController {}
Controller('/users')(UserController);
Get('/')(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));
ApiResponse({ status: 200, type: [UserDto] })(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));

module.exports = {
  openapi: '3.1.0',
  title: 'CLI E2E',
  version: '1.0.0',
  controllers: [UserController],
};
`
    );

    execFileSync(
      process.execPath,
      [
        join(process.cwd(), 'bin', 'cli.js'),
        'generate',
        configPath,
        outPath,
      ],
      { stdio: 'pipe' }
    );

    expect(existsSync(outPath)).toBe(true);
    const doc = JSON.parse(readFileSync(outPath, 'utf8'));
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toBe('CLI E2E');
    expect(Object.keys(doc.paths ?? {})).toContain('/users');
  });

  it('generate command produces YAML when --format yaml is passed', () => {
    const configPath = join(tempDir, 'openapi.config.js');
    const outPath = join(tempDir, 'openapi.yaml');
    writeFileSync(
      configPath,
      `const path = require('node:path');
const { Controller, Get, ApiResponse, ApiProperty } = require(path.resolve('${process.cwd()}/dist/index.js'));

class UserDto {}
ApiProperty({ type: String })(UserDto.prototype, 'id');

class UserController {}
Controller('/x')(UserController);
Get('/')(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));
ApiResponse({ status: 200, type: UserDto })(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));

module.exports = {
  openapi: '3.0.3',
  title: 'YAML Test',
  version: '1',
  controllers: [UserController],
};
`
    );

    execFileSync(
      process.execPath,
      [
        join(process.cwd(), 'bin', 'cli.js'),
        'generate',
        configPath,
        outPath,
        '--format',
        'yaml',
        '--openapi',
        '3.0.3',
      ],
      { stdio: 'pipe' }
    );

    expect(existsSync(outPath)).toBe(true);
    const out = readFileSync(outPath, 'utf8');
    expect(out).toMatch(/^openapi:\s*['"]?3\.0\.3['"]?/m);
    expect(out).toContain('title: YAML Test');
  });

  it('validate command exits 0 for a valid config', () => {
    const configPath = join(tempDir, 'openapi.config.js');
    writeFileSync(
      configPath,
      `const path = require('node:path');
const { Controller, Get, ApiResponse } = require(path.resolve('${process.cwd()}/dist/index.js'));

class UserController {}
Controller('/v')(UserController);
Get('/')(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));
ApiResponse({ status: 200 })(UserController.prototype, 'list',
  Object.getOwnPropertyDescriptor(UserController.prototype, 'list') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(UserController), 'list'));

module.exports = {
  openapi: '3.1.0',
  title: 'V',
  version: '1',
  controllers: [UserController],
};
`
    );

    let result: { status: number | null; stdout: string; stderr: string };
    try {
      const out = execFileSync(
        process.execPath,
        [join(process.cwd(), 'bin', 'cli.js'), 'validate', configPath],
        { stdio: 'pipe' }
      );
      result = { status: 0, stdout: out.toString(), stderr: '' };
    } catch (err) {
      const e = err as { status: number | null; stdout: Buffer; stderr: Buffer };
      result = {
        status: e.status,
        stdout: e.stdout?.toString() ?? '',
        stderr: e.stderr?.toString() ?? '',
      };
    }
    expect(result.status).toBe(0);
  });
});
