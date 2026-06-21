import { metadataStorage } from '../metadata/metadata-storage.js';

/**
 * @ApiExtension — attach an OpenAPI "x-*" extension field to an
 * operation, controller, or method.
 *
 * OpenAPI allows arbitrary extension properties on most objects, and
 * tooling such as Redoc, Swagger UI, code generators and API gateways
 * use these to attach vendor-specific metadata.
 *
 * @param key - Extension key. Must be prefixed with `x-` per the
 *              OpenAPI Specification.
 * @param value - Any JSON-serialisable value.
 *
 * @throws if the key is not prefixed with `x-`.
 *
 * @example
 * ```typescript
 * @Get('/')
 * @ApiExtension('x-internal', true)
 * @ApiExtension('x-rate-limit', { limit: 100, window: '1m' })
 * list() {}
 * ```
 */
export function ApiExtension(key: string, value: unknown): MethodDecorator & ClassDecorator {
  if (!key.startsWith('x-')) {
    throw new Error(
      `ApiExtension: key "${key}" must be prefixed with "x-" per the OpenAPI Specification.`
    );
  }

  return function (target: Function | Object, propertyKey?: string | symbol) {
    if (typeof target === 'function' && !propertyKey) {
      // Class-level extension
      metadataStorage.addExtension({
        target,
        key,
        value,
      });
    } else if (propertyKey) {
      // Method-level extension
      metadataStorage.addExtension({
        target: target.constructor,
        methodName: propertyKey as string,
        key,
        value,
      });
    }
  };
}
