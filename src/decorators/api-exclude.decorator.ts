import { metadataStorage } from '../metadata/metadata-storage.js';

/**
 * @ApiExcludeEndpoint — hide a single endpoint from the generated
 * OpenAPI document. Useful for internal helpers, health checks, or
 * deprecation paths that should not appear in public docs.
 *
 * The decorator is a no-op for the runtime route registration, so the
 * endpoint is still served by Express — it is only omitted from the
 * generated OpenAPI specification.
 *
 * @param exclude - Defaults to `true`. Set to `false` to undo a
 *                  controller-level exclusion.
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @Controller('/internal')
 * class InternalController {
 *   @ApiExcludeEndpoint()
 *   @Get('/ping')
 *   ping() {}
 * }
 * ```
 */
export function ApiExcludeEndpoint(exclude: boolean = true): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    metadataStorage.addExclude({
      target: target.constructor,
      methodName: propertyKey as string,
      exclude,
    });
  };
}

/**
 * @ApiExcludeController — hide every endpoint of a controller from
 * the generated OpenAPI document.
 *
 * @param exclude - Defaults to `true`. Set to `false` to opt a single
 *                  controller back in (e.g. for re-inclusion tests).
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @ApiExcludeController()
 * @Controller('/internal')
 * class InternalController {
 *   @Get('/a') a() {}
 *   @Get('/b') b() {}
 * }
 * ```
 */
export function ApiExcludeController(exclude: boolean = true): ClassDecorator {
  return function (target: Function) {
    metadataStorage.addExclude({
      target,
      exclude,
    });
  };
}
