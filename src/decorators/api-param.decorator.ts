import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ApiParamMetadata } from '../metadata/metadata-types.js';

/**
 * Options for @ApiParam decorator
 */
export interface ApiParamOptions {
  /**
   * Path parameter name
   */
  name: string;

  /**
   * Parameter type (String, Number)
   * @default String
   */
  type?: Function;

  /**
   * Whether the parameter is required
   * @default true
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
 * @ApiParam decorator - adds path parameter metadata to an endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/:id')
 *   @ApiParam({
 *     name: 'id',
 *     type: String,
 *     required: true,
 *     example: 'user_123',
 *     description: 'User ID'
 *   })
 *   getUser() {}
 * }
 * ```
 */
export function ApiParam(options: ApiParamOptions): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const metadata: ApiParamMetadata = {
      target: target.constructor as Function,
      methodName: propertyKey as string,
      name: options.name,
      type: options.type ?? String,
      required: options.required ?? true,
      description: options.description,
      example: options.example,
    };

    metadataStorage.addPathParam(metadata);
  };
}
