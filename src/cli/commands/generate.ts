/**
 * `generate` command — evaluate a user config, build the OpenAPI
 * document, and write it to disk in the requested format.
 */
import { resolve as resolvePath, isAbsolute } from 'node:path';
import { createOpenApiDocument } from '../../index.js';
import { loadConfig } from '../config-loader.js';
import { formatJson } from '../formatters/json.js';
import { formatYaml } from '../formatters/yaml.js';
import { writeFileEnsuringDir } from '../fs-utils.js';
import type { OpenApiVersion } from '../../types/openapi.types.js';

export interface GenerateOptions {
  configPath: string;
  outputPath: string | undefined;
  format: string;
  openapi: string;
}

/**
 * Resolve the OpenAPI version flag into the literal type the generator
 * expects. Falls back to '3.1.0' on unknown input.
 */
function resolveVersion(v: string): OpenApiVersion {
  if (v === '3.0.3' || v === '3.1.0') return v;
  return '3.1.0';
}

export async function runGenerate(opts: GenerateOptions): Promise<void> {
  const format = (opts.format || 'json').toLowerCase();
  if (format !== 'json' && format !== 'yaml') {
    throw new Error(
      `Unsupported --format "${opts.format}". Use "json" or "yaml".`
    );
  }

  const version = resolveVersion(opts.openapi);

  // Load and evaluate the user config
  const { configPath, config } = await loadConfig({ configPath: opts.configPath });

  // Determine the controllers array. The user is expected to provide
  // an array of classes decorated with @Controller. If they passed
  // a function we already invoked it in loadConfig.
  const controllers = config.controllers as Function[] | undefined;
  if (!Array.isArray(controllers)) {
    throw new Error(
      `Config "${configPath}" must export a \`controllers\` array of decorated classes.`
    );
  }

  // Build the document
  const document = createOpenApiDocument({
    ...(config as Record<string, unknown>),
    openapi: version,
    controllers,
  } as Parameters<typeof createOpenApiDocument>[0]);

  // Format + write
  const serialized = format === 'yaml' ? formatYaml(document) : formatJson(document);

  const outPath =
    opts.outputPath ??
    (isAbsolute('openapi.json') ? 'openapi.json' : resolvePath(process.cwd(), 'openapi.json'));

  await writeFileEnsuringDir(outPath, serialized);

  // eslint-disable-next-line no-console
  console.log(
    `✔ Generated ${format.toUpperCase()} document (${serialized.length} bytes) at ${outPath}`
  );
}
