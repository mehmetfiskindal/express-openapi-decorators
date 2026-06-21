/**
 * `validate` command — evaluate the user config, build the document,
 * and run a few sanity checks without writing anything to disk.
 *
 * The validation is intentionally light: the goal is to catch the
 * common "the config file loads but the document is wrong" failure
 * (missing `controllers`, malformed paths, etc.) — not to enforce
 * the full OpenAPI spec, which the generator itself already handles.
 */
import { createOpenApiDocument } from '../../index.js';
import { loadConfig } from '../config-loader.js';
import type { OpenApiVersion } from '../../types/openapi.types.js';

export interface ValidateOptions {
  configPath: string;
  openapi: string;
}

function resolveVersion(v: string): OpenApiVersion {
  if (v === '3.0.3' || v === '3.1.0') return v;
  return '3.1.0';
}

export async function runValidate(opts: ValidateOptions): Promise<void> {
  const version = resolveVersion(opts.openapi);

  const { configPath, config } = await loadConfig({ configPath: opts.configPath });

  const controllers = config.controllers as Function[] | undefined;
  if (!Array.isArray(controllers)) {
    throw new Error(
      `Config "${configPath}" must export a \`controllers\` array of decorated classes.`
    );
  }

  const document = createOpenApiDocument({
    ...(config as Record<string, unknown>),
    openapi: version,
    controllers,
  } as Parameters<typeof createOpenApiDocument>[0]);

  const pathCount = Object.keys((document as { paths?: Record<string, unknown> }).paths ?? {}).length;
  const schemaCount = Object.keys(
    (document as { components?: { schemas?: Record<string, unknown> } }).components?.schemas ?? {}
  ).length;

  if (pathCount === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠ Document has no paths. Check that your controllers have at least one @Get / @Post / etc. method.'
    );
  }

  if (!document.info || !document.info.title || !document.info.version) {
    throw new Error(
      `Document is missing required info.title or info.version. Update your config.`
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `✔ Validated: ${pathCount} path(s), ${schemaCount} schema(s), OpenAPI ${document.openapi}.`
  );
}
