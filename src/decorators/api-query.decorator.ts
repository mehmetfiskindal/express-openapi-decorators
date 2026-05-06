import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ApiQueryMetadata } from '../metadata/metadata-types.js';

/**
 * Options for @ApiQuery decorator
 */
export interface ApiQueryOptions {
  /**
   * Query parameter name
   */
  name: string;

  /**
   * Parameter type (String, Number, Boolean)
   */
  type: Function;

  /**
   * Whether the parameter is required
   * @default false
   */
  required?: boolean;

  /**
   * Description of the parameter
   */
  description?: string;

  /**
   * Example value
   */
  example?: unknown;
}

/**
 * @ApiQuery decorator - adds query parameter metadata to an endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   @ApiQuery({
 *     name: 'page',
 *     type: Number,
 *     required: false,
 *     example: 1,
 *     description: 'Page number'
 *   })
 *   @ApiQuery({
 *     name: 'limit',
 *     type: Number,
 *     required: false,
 *     example: 10,
 *     description: 'Items per page'
 *   })
 *   listUsers() {}
 * }
 * ```
 */
export function ApiQuery(options: ApiQueryOptions): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const metadata: ApiQueryMetadata = {
      target: target.constructor as Function,
      methodName: propertyKey as string,
      name: options.name,
      type: options.type,
      required: options.required ?? false,
      description: options.description,
      example: options.example,
    };

    metadataStorage.addQueryParam(metadata);
  };
}
