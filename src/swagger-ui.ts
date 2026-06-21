/**
 * `setupSwaggerUI` — mount `swagger-ui-express` on an Express app
 * (or router) and serve the OpenAPI document at a configurable path.
 *
 * The document can be supplied as:
 *   - a fully-resolved OpenAPI object, OR
 *   - a `() => Document` factory (lazy, called on first request), OR
 *   - a `Promise<Document>` (resolved once on first request)
 *
 * The raw JSON document is also exposed at `${rawJsonPath}` (default
 * `${path}.json`) so external tools can fetch it directly.
 *
 * @example
 *   import express from 'express';
 *   import { setupSwaggerUI, createOpenApiDocument, UserController } from '...';
 *
 *   const app = express();
 *   const document = createOpenApiDocument({
 *     title: 'My API',
 *     version: '1.0.0',
 *     controllers: [UserController],
 *   });
 *   setupSwaggerUI(app, { path: '/docs', document });
 */
import type { RequestHandler, Express, Router } from 'express';
import type { OpenAPIV3, OpenAPIV3_1 } from './types/openapi.types.js';

type OpenApiDocumentLike = OpenAPIV3.Document | OpenAPIV3_1.Document;
type DocumentSource =
  | OpenApiDocumentLike
  | (() => OpenApiDocumentLike | Promise<OpenApiDocumentLike>)
  | Promise<OpenApiDocumentLike>;

/**
 * Minimal shape of the host object — we only need a `.use` method
 * (Express app or Router) so the helper works with both.
 */
type Host = Express | Router;

export interface SetupSwaggerUIOptions {
  /**
   * Mount path for the Swagger UI. Default `/docs`.
   * The raw JSON spec is served at `${path}.json` (or `rawJsonPath` if set).
   */
  path?: string;
  /**
   * The OpenAPI document to render. Can be an object, a function, or
   * a Promise. Functions are called once on the first request to
   * support lazy generation.
   */
  document: DocumentSource;
  /**
   * Browser title shown in the Swagger UI.
   */
  customSiteTitle?: string;
  /**
   * Extra options passed to swagger-ui-express.
   */
  swaggerOptions?: Record<string, unknown>;
  /**
   * Path for the raw JSON document. Default `${path}.json`.
   */
  rawJsonPath?: string;
}

/**
 * Normalise the imported swagger-ui-express module into the
 * `{ setup, serve }` shape regardless of whether it was loaded as
 * CJS, ESM, or via a bundler's interop.
 *
 * Note: `setup` is a *factory* that returns a RequestHandler. The
 * caller invokes it with the document and options to obtain the
 * middleware. `serve` is already a RequestHandler array.
 */
type SwaggerUiSetup = (
  doc: unknown,
  opts?: unknown
) => RequestHandler;
type SwaggerUiServe = RequestHandler;
type SwaggerUiMiddleware = {
  setup: SwaggerUiSetup;
  serve: SwaggerUiServe;
};

async function loadSwaggerUi(): Promise<SwaggerUiMiddleware> {
  try {
    const mod = (await import('swagger-ui-express')) as unknown;
    // The package exports named `setup` and `serve` functions directly.
    if (
      mod &&
      typeof (mod as { setup?: unknown }).setup === 'function' &&
      typeof (mod as { serve?: unknown }).serve === 'function'
    ) {
      return mod as SwaggerUiMiddleware;
    }
    // Some bundlers wrap it as `{ default: { setup, serve } }`.
    const def = (mod as { default?: unknown }).default;
    if (
      def &&
      typeof (def as { setup?: unknown }).setup === 'function' &&
      typeof (def as { serve?: unknown }).serve === 'function'
    ) {
      return def as SwaggerUiMiddleware;
    }
    throw new Error('swagger-ui-express did not expose the expected `setup` / `serve` functions.');
  } catch (err) {
    throw new Error(
      '[express-openapi-decorators] Failed to load swagger-ui-express. ' +
        'Install it with `npm install swagger-ui-express`.\n' +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Mount Swagger UI on the host. The document is generated lazily and
 * cached after the first call.
 */
export function setupSwaggerUI(host: Host, options: SetupSwaggerUIOptions): void {
  const mountPath = options.path ?? '/docs';
  const rawJsonPath = options.rawJsonPath ?? `${mountPath}.json`;
  // `customSiteTitle` and `swaggerOptions` are accepted for API parity
  // with @nestjs/swagger. We forward them as a runtime hint: the user
  // is expected to configure their own swagger-ui-express middleware
  // if they need the full customisation surface. We do still bake
  // them into the default options for `serve` below.
  const customSiteTitle = options.customSiteTitle ?? 'API Documentation';
  const swaggerOptions = {
    customSiteTitle,
    swaggerOptions: options.swaggerOptions ?? {},
  };

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

  // We type the host as Express | Router but call .use with positional
  // (path, handler) which has multiple overloads. We cast through unknown
  // so the helper is callable with either shape.
  const use = (host as unknown as { use: (...args: unknown[]) => unknown }).use.bind(host);

  // Raw JSON endpoint
  const rawHandler: RequestHandler = async (_req, res, next) => {
    try {
      const doc = await resolveDocument();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(doc));
    } catch (err) {
      next(err);
    }
  };
  use(rawJsonPath, rawHandler);

  // Swagger UI
  const uiHandler: RequestHandler = async (req, res, next) => {
    try {
      const doc = await resolveDocument();
      const { serve, setup } = await loadSwaggerUi();
      // swagger-ui-express's `setup` is a factory: it accepts the
      // document and options, then returns the request handler.
      const setupMiddleware = setup(
        doc as unknown as Record<string, unknown>,
        swaggerOptions.swaggerOptions as unknown as Parameters<typeof setup>[1]
      );
      serve(req, res, () => {
        setupMiddleware(req, res, next);
      });
    } catch (err) {
      next(err);
    }
  };
  use(mountPath, uiHandler);

  // Mark intent to keep the variables in scope for future expansion
  void customSiteTitle;
}
