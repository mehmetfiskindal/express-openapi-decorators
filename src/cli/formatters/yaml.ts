/**
 * Zero-dependency YAML output formatter for the CLI and OpenAPI documents.
 * Replaces external dependency `yaml`.
 */

function shouldQuoteString(str: string): boolean {
  if (str === '' || str === 'true' || str === 'false' || str === 'null' || str === '~') {
    return true;
  }
  // If it parses as number
  if (/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(str)) {
    return true;
  }
  // If starts or ends with whitespace
  if (str.trim() !== str) {
    return true;
  }
  // Contains YAML control characters
  if (/[:#{}[\]&*?!|>'"%@`,=]/.test(str)) {
    return true;
  }
  // Starts with leading dash or question mark
  if (str.startsWith('- ') || str.startsWith('? ')) {
    return true;
  }
  return false;
}

function escapeString(str: string): string {
  return JSON.stringify(str);
}

export function stringifyYaml(value: unknown, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);

  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    if (value.includes('\n')) {
      const lines = value.split('\n');
      return '|\n' + lines.map((l) => (l.length > 0 ? childIndent + l : '')).join('\n');
    }
    if (shouldQuoteString(value)) {
      return escapeString(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value
      .map((item) => {
        if (item !== null && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length > 0) {
          // Object inside array
          const keys = Object.keys(item);
          const firstKey = keys[0]!;
          const firstVal = (item as Record<string, unknown>)[firstKey];
          const remainingKeys = keys.slice(1);

          let firstLine = '';
          if (
            firstVal !== null &&
            typeof firstVal === 'object' &&
            !(Array.isArray(firstVal) && firstVal.length === 0) &&
            !(Object.keys(firstVal).length === 0)
          ) {
            firstLine = `${indent}- ${formatKey(firstKey)}:\n${stringifyYaml(firstVal, indentLevel + 2)}`;
          } else {
            firstLine = `${indent}- ${formatKey(firstKey)}: ${stringifyYaml(firstVal, indentLevel + 2)}`;
          }

          if (remainingKeys.length === 0) {
            return firstLine;
          }

          const restLines = remainingKeys
            .map((k) => {
              const v = (item as Record<string, unknown>)[k];
              if (
                v !== null &&
                typeof v === 'object' &&
                !(Array.isArray(v) && v.length === 0) &&
                !(Object.keys(v).length === 0)
              ) {
                return `${childIndent}${formatKey(k)}:\n${stringifyYaml(v, indentLevel + 2)}`;
              }
              return `${childIndent}${formatKey(k)}: ${stringifyYaml(v, indentLevel + 2)}`;
            })
            .join('\n');

          return `${firstLine}\n${restLines}`;
        }

        if (Array.isArray(item) && item.length > 0) {
          return `${indent}-\n${stringifyYaml(item, indentLevel + 1)}`;
        }

        return `${indent}- ${stringifyYaml(item, indentLevel + 1)}`;
      })
      .join('\n');
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return '{}';
    }

    return keys
      .map((key) => {
        const val = (value as Record<string, unknown>)[key];
        const formattedKey = formatKey(key);

        if (
          val !== null &&
          typeof val === 'object' &&
          !(Array.isArray(val) && val.length === 0) &&
          !(Object.keys(val).length === 0)
        ) {
          return `${indent}${formattedKey}:\n${stringifyYaml(val, indentLevel + 1)}`;
        }

        return `${indent}${formattedKey}: ${stringifyYaml(val, indentLevel + 1)}`;
      })
      .join('\n');
  }

  return String(value);
}

function formatKey(key: string): string {
  if (shouldQuoteString(key)) {
    return escapeString(key);
  }
  return key;
}

export function formatYaml(document: unknown): string {
  const yaml = stringifyYaml(document);
  return yaml.endsWith('\n') ? yaml : `${yaml}\n`;
}
