import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ApiHeaderMetadata } from '../metadata/metadata-types.js';

/**
 * Options for @ApiHeader decorator
 */
export interface ApiHeaderOptions {
  /**
   * Header parameter name (e.g. 'X-Request-Id')
   */
  name: string;

  /**
   * Parameter type (String, Number, Boolean)
   * @default String
   */
  type?: Function;

  /**
   * Whether the header is required
   * @default false
   */
  required?: boolean;

  /**
   * Description of the header
   */
  description?: string;

  /**
   * Example value
   */
  example?: unknown;

  /**
   * OpenAPI format hint
   */
  format?: string;

  /**
   * Allowed values
   */
  enum?: unknown[];

  /**
   * Default value
   */
  default?: unknown;

  /**
   * Mark the header as deprecated
   * @default false
   */
  deprecated?: boolean;
}

/**
 * @ApiHeader decorator — declares a request header parameter on an
 * endpoint or controller. Mirrors `@ApiQuery` but with `in: 'header'`
 * baked into the generated OpenAPI parameter object.
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   @ApiHeader({
 *     name: 'X-Request-Id',
 *     required: false,
 *     description: 'Optional request correlation id'
 *   })
 *   list() {}
 * }
 * ```
 */
export function ApiHeader(options: ApiHeaderOptions): MethodDecorator & ClassDecorator {
  return (target: Function | Object, propertyKey?: string | symbol) => {
    const metadata: ApiHeaderMetadata = {
      target: typeof target === 'function' ? target : (target.constructor as Function),
      methodName: propertyKey !== undefined ? (propertyKey as string) : undefined,
      name: options.name,
      type: options.type ?? String,
      required: options.required ?? false,
      description: options.description,
      example: options.example,
      format: options.format,
      enum: options.enum,
      default: options.default,
      deprecated: options.deprecated ?? false,
    };

    metadataStorage.addHeaderParam(metadata);
  };
}

/**
 * @ApiHeaders decorator — convenience for declaring multiple header
 * parameters at once.
 *
 * @example
 * ```typescript
 * @ApiHeaders([
 *   { name: 'X-Request-Id', description: 'Correlation id' },
 *   { name: 'X-Tenant', required: true }
 * ])
 * @Get('/')
 * list() {}
 * ```
 */
export function ApiHeaders(headers: ApiHeaderOptions[]): MethodDecorator & ClassDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    for (const options of headers) {
      const dec = ApiHeader(options);
      if (propertyKey === undefined) {
        // Class decorator
        (dec as ClassDecorator)(target as Function);
      } else {
        // Method decorator
        (dec as MethodDecorator)(
          target as Object,
          propertyKey,
          descriptor as PropertyDescriptor
        );
      }
    }
  };
}
