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

  /**
   * Override the controller-level tags for this operation.
   * When provided, the controller's @ApiTags are ignored and only
   * the tags listed here are emitted on the operation.
   */
  tags?: string[];
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
      tags: options.tags,
    };

    metadataStorage.addOperation(metadata);
  };
}

/**
 * @Summary decorator - shorthand for @ApiOperation with only summary
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   @Summary('List all users')
 *   getUsers() {}
 * }
 * ```
 */
export function Summary(summary: string): MethodDecorator {
  return ApiOperation({ summary });
}

/**
 * @Description decorator - adds or appends description to operation metadata
 * Can be used alone (creates operation with empty summary) or combined with @Summary
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   @Summary('List all users')
 *   @Description('Returns a paginated list of all users with filtering options')
 *   getUsers() {}
 * }
 * ```
 */
export function Description(description: string): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const existingOperation = metadataStorage.getOperationForMethod(
      target.constructor as Function,
      propertyKey as string
    );

    if (existingOperation) {
      // Append to existing description if any
      existingOperation.description = existingOperation.description
        ? `${existingOperation.description}\n\n${description}`
        : description;
    } else {
      // Create new operation with empty summary
      const metadata: ApiOperationMetadata = {
        target: target.constructor as Function,
        methodName: propertyKey as string,
        summary: '',
        description: description,
        operationId: undefined,
        deprecated: false,
        tags: undefined,
      };
      metadataStorage.addOperation(metadata);
    }
  };
}
