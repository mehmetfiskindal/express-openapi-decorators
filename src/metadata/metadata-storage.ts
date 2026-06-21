import 'reflect-metadata';
import type {
  ControllerMetadata,
  MethodMetadata,
  ApiOperationMetadata,
  ApiResponseMetadata,
  ApiBodyMetadata,
  ApiQueryMetadata,
  ApiParamMetadata,
  ApiHeaderMetadata,
  ApiPropertyMetadata,
  ApiTagsMetadata,
  SecuritySchemeMetadata,
  ApiSecurityMetadata,
  ApiFileMetadata,
  ApiConsumesMetadata,
  ApiProducesMetadata,
  ApiExcludeMetadata,
  ApiExtensionMetadata,
  ApiSchemaMetadata,
  ApiCallbackMetadata,
  ApiResponseHeaderMetadata,
  ApiLinkMetadata,
  MiddlewareMetadata,
  MiddlewareReference,
} from './metadata-types.js';

/**
 * Global metadata storage singleton
 * All decorators store their metadata here for later processing
 */
class MetadataStorageImpl {
  readonly controllers: ControllerMetadata[] = [];
  readonly methods: MethodMetadata[] = [];
  readonly operations: ApiOperationMetadata[] = [];
  readonly responses: ApiResponseMetadata[] = [];
  readonly bodyParams: ApiBodyMetadata[] = [];
  readonly queryParams: ApiQueryMetadata[] = [];
  readonly pathParams: ApiParamMetadata[] = [];
  readonly headerParams: ApiHeaderMetadata[] = [];
  readonly properties: ApiPropertyMetadata[] = [];
  readonly tags: ApiTagsMetadata[] = [];
  readonly securitySchemes: SecuritySchemeMetadata[] = [];
  readonly securityRequirements: ApiSecurityMetadata[] = [];
  readonly fileParams: ApiFileMetadata[] = [];
  readonly consumes: ApiConsumesMetadata[] = [];
  readonly produces: ApiProducesMetadata[] = [];
  readonly excludes: ApiExcludeMetadata[] = [];
  readonly extraModels: Set<Function> = new Set();
  readonly extensions: ApiExtensionMetadata[] = [];
  readonly schemaNames: ApiSchemaMetadata[] = [];
  readonly callbacks: ApiCallbackMetadata[] = [];
  readonly responseHeaders: ApiResponseHeaderMetadata[] = [];
  readonly links: ApiLinkMetadata[] = [];
  readonly middlewares: MiddlewareMetadata[] = [];

  /**
   * Add controller metadata
   */
  addController(metadata: ControllerMetadata): void {
    this.controllers.push(metadata);
  }

  /**
   * Add method metadata
   */
  addMethod(metadata: MethodMetadata): void {
    this.methods.push(metadata);
  }

  /**
   * Add operation metadata
   */
  addOperation(metadata: ApiOperationMetadata): void {
    this.operations.push(metadata);
  }

  /**
   * Add response metadata
   */
  addResponse(metadata: ApiResponseMetadata): void {
    this.responses.push(metadata);
  }

  /**
   * Add body parameter metadata
   */
  addBodyParam(metadata: ApiBodyMetadata): void {
    this.bodyParams.push(metadata);
  }

  /**
   * Add query parameter metadata
   */
  addQueryParam(metadata: ApiQueryMetadata): void {
    this.queryParams.push(metadata);
  }

  /**
   * Add path parameter metadata
   */
  addPathParam(metadata: ApiParamMetadata): void {
    this.pathParams.push(metadata);
  }

  /**
   * Add header parameter metadata
   */
  addHeaderParam(metadata: ApiHeaderMetadata): void {
    this.headerParams.push(metadata);
  }

  /**
   * Get header parameters for a specific method (excludes controller-level)
   */
  getHeaderParamsForMethod(target: Function, methodName: string): ApiHeaderMetadata[] {
    return this.headerParams.filter(
      (h) => h.target === target && h.methodName === methodName
    );
  }

  /**
   * Get controller-level header parameters (methodName === undefined)
   */
  getHeaderParamsForController(controller: Function): ApiHeaderMetadata[] {
    return this.headerParams.filter(
      (h) => h.target === controller && h.methodName === undefined
    );
  }

  /**
   * Add property metadata for DTOs
   */
  addProperty(metadata: ApiPropertyMetadata): void {
    this.properties.push(metadata);
  }

  /**
   * Add tags metadata
   * Multiple @ApiTags on the same target are merged into a single record
   * so the union of all tag lists is preserved.
   */
  addTags(metadata: ApiTagsMetadata): void {
    const existing = this.tags.find((t) => t.target === metadata.target);
    if (existing) {
      const merged = new Set<string>([...existing.tags, ...metadata.tags]);
      existing.tags = Array.from(merged);
    } else {
      this.tags.push(metadata);
    }
  }

  /**
   * Add security scheme metadata
   */
  addSecurityScheme(metadata: SecuritySchemeMetadata): void {
    // Check if scheme already exists
    const existingIndex = this.securitySchemes.findIndex(s => s.name === metadata.name);
    if (existingIndex >= 0) {
      this.securitySchemes[existingIndex] = metadata;
    } else {
      this.securitySchemes.push(metadata);
    }
  }

  /**
   * Add security requirement metadata
   * Duplicate (target, methodName, schemes) tuples are ignored to prevent
   * emitting redundant `security` entries when the same scheme is applied
   * more than once to the same route.
   */
  addSecurityRequirement(metadata: ApiSecurityMetadata): void {
    const key = `${metadata.target.name || metadata.target.toString()}|${metadata.methodName ?? ''}|[${[...metadata.schemes].sort().join(',')}]`;
    const exists = this.securityRequirements.some(
      (r) =>
        r.target === metadata.target &&
        r.methodName === metadata.methodName &&
        r.schemes.length === metadata.schemes.length &&
        [...r.schemes].sort().join(',') === [...metadata.schemes].sort().join(',')
    );
    if (!exists) {
      this.securityRequirements.push(metadata);
    }
    // key is computed for future use / debugging; left in for clarity.
    void key;
  }

  /**
   * Get all security schemes
   */
  getSecuritySchemes(): SecuritySchemeMetadata[] {
    return this.securitySchemes;
  }

  /**
   * Get security requirements for a specific method
   */
  getSecurityForMethod(target: Function, methodName: string): ApiSecurityMetadata[] {
    return this.securityRequirements.filter(
      (s) => s.target === target && s.methodName === methodName
    );
  }

  /**
   * Get security requirements for a controller (controller-level)
   */
  getSecurityForController(controller: Function): ApiSecurityMetadata[] {
    return this.securityRequirements.filter(
      (s) => s.target === controller && s.methodName === undefined
    );
  }

  /**
   * Add file parameter metadata
   */
  addFileParam(metadata: ApiFileMetadata): void {
    this.fileParams.push(metadata);
  }

  /**
   * Get file parameters for a specific method
   */
  getFileParamsForMethod(target: Function, methodName: string): ApiFileMetadata[] {
    return this.fileParams.filter(
      (f) => f.target === target && f.methodName === methodName
    );
  }

  /**
   * Add consumes metadata
   */
  addConsumes(metadata: ApiConsumesMetadata): void {
    this.consumes.push(metadata);
  }

  /**
   * Get consumes metadata for a specific method
   */
  getConsumesForMethod(target: Function, methodName: string): ApiConsumesMetadata | undefined {
    return this.consumes.find(
      (c) => c.target === target && c.methodName === methodName
    );
  }

  /**
   * Add produces metadata (@ApiProduces)
   */
  addProduces(metadata: ApiProducesMetadata): void {
    this.produces.push(metadata);
  }

  /**
   * Get produces metadata for a specific method
   */
  getProducesForMethod(target: Function, methodName: string): ApiProducesMetadata | undefined {
    return this.produces.find(
      (p) => p.target === target && p.methodName === methodName
    );
  }

  /**
   * Add exclude metadata (@ApiExcludeEndpoint / @ApiExcludeController)
   */
  addExclude(metadata: ApiExcludeMetadata): void {
    this.excludes.push(metadata);
  }

  /**
   * Returns true if a controller should be excluded entirely.
   */
  isControllerExcluded(controller: Function): boolean {
    return this.excludes.some(
      (e) => e.target === controller && e.methodName === undefined && e.exclude
    );
  }

  /**
   * Returns true if a specific method should be excluded.
   * A controller-level @ApiExcludeController() overrides everything.
   */
  isMethodExcluded(target: Function, methodName: string): boolean {
    if (this.isControllerExcluded(target)) return true;
    return this.excludes.some(
      (e) => e.target === target && e.methodName === methodName && e.exclude
    );
  }

  /**
   * Register a class to be included in `components.schemas` even when
   * it is not directly referenced by any response or body parameter.
   */
  addExtraModel(model: Function): void {
    this.extraModels.add(model);
  }

  /**
   * Get the snapshot of currently registered extra models.
   */
  getExtraModels(): Function[] {
    return Array.from(this.extraModels);
  }

  /**
   * Register an OpenAPI "x-*" extension value.
   * Multiple @ApiExtension on the same target are merged, with later
   * declarations overwriting earlier ones on the same key.
   */
  addExtension(metadata: ApiExtensionMetadata): void {
    const idx = this.extensions.findIndex(
      (e) =>
        e.target === metadata.target &&
        e.methodName === metadata.methodName &&
        e.key === metadata.key
    );
    if (idx >= 0) {
      this.extensions[idx] = metadata;
    } else {
      this.extensions.push(metadata);
    }
  }

  /**
   * Get the merged extensions map for a method (controller-level
   * extensions are inherited and can be overridden by method-level).
   */
  getExtensionsForMethod(target: Function, methodName: string): Record<string, unknown> {
    const merged: Record<string, unknown> = {};
    for (const e of this.extensions) {
      if (e.target === target && e.methodName === undefined) {
        merged[e.key] = e.value;
      }
    }
    for (const e of this.extensions) {
      if (e.target === target && e.methodName === methodName) {
        merged[e.key] = e.value;
      }
    }
    return merged;
  }

  /**
   * Register a schema name override for a DTO class (@ApiSchema).
   * If multiple are registered, the last one wins.
   */
  addSchemaName(metadata: ApiSchemaMetadata): void {
    const existing = this.schemaNames.findIndex((s) => s.target === metadata.target);
    if (existing >= 0) {
      this.schemaNames[existing] = metadata;
    } else {
      this.schemaNames.push(metadata);
    }
  }

  /**
   * Returns the override name for a DTO, or `undefined` to keep the
   * class's `.name`.
   */
  getSchemaNameFor(target: Function): string | undefined {
    return this.schemaNames.find((s) => s.target === target)?.name;
  }

  /**
   * Register a callback definition (@ApiCallback / @ApiCallbacks).
   */
  addCallback(metadata: ApiCallbackMetadata): void {
    this.callbacks.push(metadata);
  }

  /**
   * Get all callbacks for a method.
   */
  getCallbacksForMethod(target: Function, methodName: string): ApiCallbackMetadata[] {
    return this.callbacks.filter(
      (c) => c.target === target && c.methodName === methodName
    );
  }

  /**
   * Register response headers (@ApiResponse.options.headers).
   */
  addResponseHeaders(metadata: ApiResponseHeaderMetadata): void {
    // If a previous declaration for the same status exists, merge into it
    const existing = this.responseHeaders.find(
      (r) => r.target === metadata.target && r.methodName === metadata.methodName && r.status === metadata.status
    );
    if (existing) {
      existing.headers = { ...existing.headers, ...metadata.headers };
    } else {
      this.responseHeaders.push(metadata);
    }
  }

  /**
   * Get response headers for a specific method + status code.
   */
  getResponseHeadersForMethod(
    target: Function,
    methodName: string,
    status: number
  ): Record<string, import('./metadata-types.js').ApiResponseHeaderDefinition> | undefined {
    const m = this.responseHeaders.find(
      (r) => r.target === target && r.methodName === methodName && r.status === status
    );
    return m?.headers;
  }

  /**
   * Register a link definition (@ApiLink).
   */
  addLink(metadata: ApiLinkMetadata): void {
    this.links.push(metadata);
  }

  /**
   * Get all links for a specific method.
   */
  getLinksForMethod(target: Function, methodName: string): ApiLinkMetadata[] {
    return this.links.filter(
      (l) => l.target === target && l.methodName === methodName
    );
  }

  /**
   * Add middleware metadata
   */
  addMiddleware(metadata: MiddlewareMetadata): void {
    this.middlewares.push(metadata);
  }

  /**
   * Get middlewares for a specific method
   */
  getMiddlewaresForMethod(target: Function, methodName: string): MiddlewareReference[] {
    const methodMiddlewares = this.middlewares.filter(
      (m) => m.target === target && m.methodName === methodName
    );
    return methodMiddlewares.flatMap(m => m.middlewares);
  }

  /**
   * Get controller-level middlewares
   */
  getMiddlewaresForController(controller: Function): MiddlewareReference[] {
    const controllerMiddlewares = this.middlewares.filter(
      (m) => m.target === controller && m.methodName === undefined
    );
    return controllerMiddlewares.flatMap(m => m.middlewares);
  }

  /**
   * Get all methods for a specific controller
   */
  getMethodsForController(controller: Function): MethodMetadata[] {
    return this.methods.filter((m) => m.controllerTarget === controller);
  }

  /**
   * Get operation metadata for a specific method
   */
  getOperationForMethod(target: Function, methodName: string): ApiOperationMetadata | undefined {
    return this.operations.find(
      (o) => o.target === target && o.methodName === methodName
    );
  }

  /**
   * Get all responses for a specific method
   */
  getResponsesForMethod(target: Function, methodName: string): ApiResponseMetadata[] {
    return this.responses.filter(
      (r) => r.target === target && r.methodName === methodName
    );
  }

  /**
   * Get body parameter for a specific method
   */
  getBodyParamForMethod(target: Function, methodName: string): ApiBodyMetadata | undefined {
    return this.bodyParams.find(
      (b) => b.target === target && b.methodName === methodName
    );
  }

  /**
   * Get all query parameters for a specific method
   */
  getQueryParamsForMethod(target: Function, methodName: string): ApiQueryMetadata[] {
    return this.queryParams.filter(
      (q) => q.target === target && q.methodName === methodName
    );
  }

  /**
   * Get all path parameters for a specific method
   */
  getPathParamsForMethod(target: Function, methodName: string): ApiParamMetadata[] {
    return this.pathParams.filter(
      (p) => p.target === target && p.methodName === methodName
    );
  }

  /**
   * Get all properties for a specific DTO class
   */
  getPropertiesForTarget(target: Function): ApiPropertyMetadata[] {
    return this.properties.filter((p) => p.target === target);
  }

  /**
   * Get tags for a specific controller
   * Merges tags from every @ApiTags declaration on the controller
   */
  getTagsForController(controller: Function): string[] {
    const merged = new Set<string>();
    for (const t of this.tags) {
      if (t.target === controller) {
        for (const tag of t.tags) {
          merged.add(tag);
        }
      }
    }
    return Array.from(merged);
  }

  /**
   * Find controller by target class
   */
  findController(target: Function): ControllerMetadata | undefined {
    return this.controllers.find((c) => c.target === target);
  }

  /**
   * Clear all metadata (useful for testing)
   * Also clears the schema cache to avoid stale schemas across runs.
   */
  clear(): void {
    this.controllers.length = 0;
    this.methods.length = 0;
    this.operations.length = 0;
    this.responses.length = 0;
    this.bodyParams.length = 0;
    this.queryParams.length = 0;
    this.pathParams.length = 0;
    this.headerParams.length = 0;
    this.properties.length = 0;
    this.tags.length = 0;
    this.securitySchemes.length = 0;
    this.securityRequirements.length = 0;
    this.fileParams.length = 0;
    this.consumes.length = 0;
    this.produces.length = 0;
    this.excludes.length = 0;
    this.extraModels.clear();
    this.extensions.length = 0;
    this.schemaNames.length = 0;
    this.callbacks.length = 0;
    this.responseHeaders.length = 0;
    this.links.length = 0;
    this.middlewares.length = 0;
    // Reset schema cache so re-running with the same DTO class reflects
    // any updates to the decorator metadata.
    try {
      // Lazy import to avoid a circular dependency at module load.
      const schemaMod = require('../generator/schema-generator.js') as {
        clearSchemaCache?: () => void;
      };
      schemaMod.clearSchemaCache?.();
    } catch {
      // If the schema module is not available for any reason, the cache
      // simply stays as-is. Generation will still work, but stale entries
      // may be served.
    }
  }
}

/**
 * Global metadata storage instance
 */
/**
 * Singleton metadata storage.
 *
 * The storage is keyed on `globalThis` so that CJS and ESM bundles
 * of this package share a single instance. Without this trick, a user
 * config that does `require('.../dist/index.js')` (CJS) populates a
 * different storage than the CLI which uses `import('.../dist/index.mjs')`
 * (ESM), and the generated document comes out empty.
 */
type GlobalWithStorage = typeof globalThis & {
  __expressOpenApiDecoratorsStorage?: MetadataStorageImpl;
};
const _g = globalThis as GlobalWithStorage;
export const metadataStorage: MetadataStorageImpl =
  _g.__expressOpenApiDecoratorsStorage ??
  (_g.__expressOpenApiDecoratorsStorage = new MetadataStorageImpl());

/**
 * Metadata keys for reflect-metadata
 */
export const MetadataKeys = {
  DESIGN_TYPE: 'design:type',
  DESIGN_PARAM_TYPES: 'design:paramtypes',
  DESIGN_RETURN_TYPE: 'design:returntype',
} as const;
