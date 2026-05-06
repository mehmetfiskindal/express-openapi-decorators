import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ApiOperationMetadata } from '../metadata/metadata-types.js';

/**
 * Options for @ApiOperation decorator
 */
export interface ApiOperationOptions {
  /**
   * A short summary of what the operation does
   */
  summary: string;

  /**
   * A verbose explanation of the operation behavior
   */
  description?: string;

  /**
   * Unique string used to identify the operation
   */
  operationId?: string;

  /**
   * Declares this operation to be deprecated
   * @default false
   */
  deprecated?: boolean;
}

/**
 * @ApiOperation decorator - adds OpenAPI operation metadata to an endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   @ApiOperation({
 *     summary: 'List all users',
 *     description: 'Returns a paginated list of all users'
 *   })
 *   getUsers() {}
 * }
 * ```
 */
export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const metadata: ApiOperationMetadata = {
      target: target.constructor as Function,
      methodName: propertyKey as string,
      summary: options.summary,
      description: options.description,
      operationId: options.operationId,
      deprecated: options.deprecated ?? false,
    };

    metadataStorage.addOperation(metadata);
  };
}
