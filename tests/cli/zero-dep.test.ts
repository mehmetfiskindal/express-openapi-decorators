import { describe, it, expect } from 'vitest';
import { formatYaml, stringifyYaml } from '../../src/cli/formatters/yaml';
import { globToRegExp, findMatchingFiles } from '../../src/discovery/glob-utils';
import { parseArgs } from '../../src/cli/parser';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

describe('Zero-Dependency Modules', () => {
  describe('Zero-dep YAML Serializer', () => {
    it('handles booleans, numbers, null, and strings', () => {
      const doc = {
        boolTrue: true,
        boolFalse: false,
        numInt: 42,
        numFloat: 3.14,
        nullable: null,
        str: 'hello world',
      };
      const yaml = formatYaml(doc);
      expect(yaml).toContain('boolTrue: true');
      expect(yaml).toContain('boolFalse: false');
      expect(yaml).toContain('numInt: 42');
      expect(yaml).toContain('numFloat: 3.14');
      expect(yaml).toContain('nullable: null');
      expect(yaml).toContain('str: hello world');
    });

    it('quotes strings with special characters', () => {
      const doc = {
        spec1: 'value: with colon',
        spec2: 'true',
        spec3: '12345',
        spec4: '@custom',
      };
      const yaml = formatYaml(doc);
      expect(yaml).toContain('spec1: "value: with colon"');
      expect(yaml).toContain('spec2: "true"');
      expect(yaml).toContain('spec3: "12345"');
      expect(yaml).toContain('spec4: "@custom"');
    });

    it('serializes multiline strings with literal block indicator', () => {
      const doc = {
        desc: 'Line 1\nLine 2\nLine 3',
      };
      const yaml = formatYaml(doc);
      expect(yaml).toContain('desc: |\n    Line 1\n    Line 2\n    Line 3');
    });

    it('serializes nested objects and arrays of objects', () => {
      const doc = {
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        tags: [
          { name: 'Users', description: 'User ops' },
          { name: 'Orders', description: 'Order ops' },
        ],
      };
      const yaml = formatYaml(doc);
      expect(yaml).toContain('info:\n  title: Test\n  version: 1.0.0');
      expect(yaml).toContain('tags:\n  - name: Users\n    description: User ops\n  - name: Orders\n    description: Order ops');
    });
  });

  describe('Zero-dep Glob & File Walker', () => {
    it('globToRegExp matches simple and wildcard paths', () => {
      const re1 = globToRegExp('*.ts');
      expect(re1.test('user.controller.ts')).toBe(true);
      expect(re1.test('dir/user.controller.ts')).toBe(false);

      const re2 = globToRegExp('src/**/*.controller.ts');
      expect(re2.test('src/users/user.controller.ts')).toBe(true);
      expect(re2.test('src/user.controller.ts')).toBe(true);
      expect(re2.test('other/user.controller.ts')).toBe(false);
    });

    it('findMatchingFiles discovers files matching pattern in directory', async () => {
      const temp = join(tmpdir(), `zd-test-${Date.now()}`);
      mkdirSync(join(temp, 'src', 'controllers'), { recursive: true });
      writeFileSync(join(temp, 'src', 'controllers', 'a.controller.ts'), '');
      writeFileSync(join(temp, 'src', 'controllers', 'b.controller.ts'), '');
      writeFileSync(join(temp, 'src', 'controllers', 'c.helper.ts'), '');

      const matches = await findMatchingFiles('src/**/*.controller.ts', { cwd: temp });
      expect(matches).toHaveLength(2);
      expect(matches.some((f) => f.endsWith('a.controller.ts'))).toBe(true);
      expect(matches.some((f) => f.endsWith('b.controller.ts'))).toBe(true);
      expect(matches.some((f) => f.endsWith('c.helper.ts'))).toBe(false);
    });
  });

  describe('Zero-dep CLI Parser', () => {
    it('parses generate command with positional arguments and options', () => {
      const res = parseArgs([
        'node',
        'cli.js',
        'generate',
        'openapi.config.ts',
        'dist/openapi.json',
        '--format',
        'yaml',
        '--openapi',
        '3.0.3',
      ]);
      expect(res.command).toBe('generate');
      expect(res.args).toEqual(['openapi.config.ts', 'dist/openapi.json']);
      expect(res.options.format).toBe('yaml');
      expect(res.options.openapi).toBe('3.0.3');
    });

    it('parses validate command and flags', () => {
      const res = parseArgs([
        'node',
        'cli.js',
        'validate',
        'openapi.config.ts',
        '--openapi',
        '3.1.0',
      ]);
      expect(res.command).toBe('validate');
      expect(res.args).toEqual(['openapi.config.ts']);
      expect(res.options.openapi).toBe('3.1.0');
    });

    it('parses help and version flags', () => {
      const res1 = parseArgs(['node', 'cli.js', '--help']);
      expect(res1.options.help).toBe(true);

      const res2 = parseArgs(['node', 'cli.js', '-v']);
      expect(res2.options.version).toBe(true);
    });
  });
});
