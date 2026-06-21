/**
 * YAML output formatter for the CLI.
 * Uses the `yaml` package which produces clean, human-friendly output
 * (no inline JSON, no tag-prefix noise).
 */
import { stringify as yamlStringify } from 'yaml';

export function formatYaml(document: unknown): string {
  return yamlStringify(document, {
    indent: 2,
    lineWidth: 120,
  } as unknown as Parameters<typeof yamlStringify>[1]);
}
