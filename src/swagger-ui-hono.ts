/**
 * Zero-dependency Swagger UI helper for Hono applications.
 * Serves the raw OpenAPI JSON document and an interactive Swagger UI interface via CDN.
 */

import type { OpenAPIV3, OpenAPIV3_1 } from './types/openapi.types.js';

type OpenApiDocumentLike = OpenAPIV3.Document | OpenAPIV3_1.Document;
type DocumentSource =
  | OpenApiDocumentLike
  | (() => OpenApiDocumentLike | Promise<OpenApiDocumentLike>)
  | Promise<OpenApiDocumentLike>;

export interface SetupHonoSwaggerUIOptions {
  /**
   * Mount path for the Swagger UI. Default `/docs`.
   * The raw JSON spec is served at `${path}.json` (or `rawJsonPath` if set).
   */
  path?: string;

  /**
   * The OpenAPI document to render. Can be an object, a function, or a Promise.
   */
  document: DocumentSource;

  /**
   * Browser page title shown in the Swagger UI. Default `API Documentation`.
   */
  customSiteTitle?: string;

  /**
   * Path for the raw JSON document. Default `${path}.json`.
   */
  rawJsonPath?: string;

  /**
   * Additional Swagger UI configuration options.
   */
  swaggerOptions?: Record<string, unknown>;
}

export function generateSwaggerUiHtml(jsonUrl: string, title = 'API Documentation', customOptions: Record<string, unknown> = {}): string {
  const config = JSON.stringify({
    url: jsonUrl,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: ['SwaggerUIBundle.presets.apis', 'SwaggerUIStandalonePreset'],
    plugins: ['SwaggerUIBundle.plugins.DownloadUrl'],
    layout: 'StandaloneLayout',
    ...customOptions,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const config = ${config};
      config.presets = [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset];
      config.plugins = [SwaggerUIBundle.plugins.DownloadUrl];
      window.ui = SwaggerUIBundle(config);
    };
  </script>
</body>
</html>`;
}

/**
 * Mount Swagger UI on a Hono application.
 */
export function setupHonoSwaggerUI(app: { get: (path: string, handler: (c: any) => any) => any }, options: SetupHonoSwaggerUIOptions): void {
  const mountPath = options.path ?? '/docs';
  const rawJsonPath = options.rawJsonPath ?? `${mountPath}.json`;
  const title = options.customSiteTitle ?? 'API Documentation';

  let cached: OpenApiDocumentLike | undefined;
  let inflight: Promise<OpenApiDocumentLike> | undefined;

  async function resolveDocument(): Promise<OpenApiDocumentLike> {
    if (cached) return cached;
    if (inflight) return inflight;
    const source = options.document;
    let p: Promise<OpenApiDocumentLike>;
    if (typeof source === 'function') {
      const result = (source as () => OpenApiDocumentLike | Promise<OpenApiDocumentLike>)();
      p = Promise.resolve(result);
    } else {
      p = Promise.resolve(source as OpenApiDocumentLike);
    }
    inflight = p.then((doc) => {
      cached = doc;
      inflight = undefined;
      return doc;
    });
    return inflight;
  }

  // Raw JSON spec endpoint
  app.get(rawJsonPath, async (c: any) => {
    const doc = await resolveDocument();
    return c.json(doc);
  });

  // Interactive Swagger UI HTML endpoint
  app.get(mountPath, (c: any) => {
    const html = generateSwaggerUiHtml(rawJsonPath, title, options.swaggerOptions);
    return c.html(html);
  });
}
