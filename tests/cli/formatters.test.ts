import { describe, it, expect } from 'vitest';
import { formatJson } from '../../src/cli/formatters/json';
import { formatYaml } from '../../src/cli/formatters/yaml';

describe('CLI: formatters', () => {
  describe('formatJson', () => {
    it('produces a 2-space indented string ending with newline', () => {
      const out = formatJson({ a: 1, b: { c: 2 } });
      expect(out).toBe('{\n  "a": 1,\n  "b": {\n    "c": 2\n  }\n}\n');
    });

    it('serialises arrays in order', () => {
      const out = formatJson([1, 2, 3]);
      expect(out).toBe('[\n  1,\n  2,\n  3\n]\n');
    });

    it('handles strings with special characters', () => {
      const out = formatJson({ s: 'a "quoted" string' });
      expect(out).toContain('"a \\"quoted\\" string"');
    });
  });

  describe('formatYaml', () => {
    it('produces a YAML string with 2-space indent', () => {
      const out = formatYaml({ a: 1, b: { c: 2 } });
      expect(out).toContain('a: 1');
      expect(out).toContain('b:');
      expect(out).toContain('  c: 2');
    });

    it('handles arrays', () => {
      const out = formatYaml({ list: ['a', 'b', 'c'] });
      expect(out).toMatch(/list:\s*\n\s*-\s*a/);
    });
  });
});
