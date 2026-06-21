import { metadataStorage } from '../metadata/metadata-storage.js';
import type {
  ApiResponseHeaderDefinition,
  ApiResponseMetadata,
} from '../metadata/metadata-types.js';

/**
 * Single response header definition
 */
export interface ApiResponseHeaderOptions extends ApiResponseHeaderDefinition {}

/**
 * Options for @ApiResponse decorator
 */
export interface ApiResponseOptions {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * A short description of the response
   */
  description?: string;

  /**
   * The schema for the response body
   * Can be a DTO class or an array of DTO classes: [UserDto]
   */
  type?: Function | [Function];

  /**
   * Response headers keyed by header name (e.g. `'X-RateLimit-Remaining'`).
   * Each entry is emitted on the response's `headers` map.
   */
  headers?: Record<string, ApiResponseHeaderOptions>;
}

/**
 * @ApiResponse decorator - adds response metadata to an endpoint
 * 
 * Can be used in two ways:
 * 1. Simple: @ApiResponse(200, UserDto) or @ApiResponse(200, [UserDto])
 * 2. Detailed: @ApiResponse({ status: 200, description: 'Success', type: UserDto })
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   @ApiResponse({
 *     status: 200,
 *     description: 'List of users',
 *     type: [UserDto]
 *   })
 *   @ApiResponse({
 *     status: 401,
 *     description: 'Unauthorized',
 *     type: ErrorDto
 *   })
 *   getUsers() {}
 * }
 * ```
 */
export function ApiResponse(status: number, type: Function | [Function]): MethodDecorator;
export function ApiResponse(options: ApiResponseOptions): MethodDecorator;
export function ApiResponse(
  statusOrOptions: number | ApiResponseOptions,
  typeArg?: Function | [Function]
): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    let status: number;
    let type: Function | undefined;
    let description: string | undefined;
    let isArray = false;
    let headers: Record<string, ApiResponseHeaderDefinition> | undefined;

    if (typeof statusOrOptions === 'number') {
      status = statusOrOptions;
      if (typeArg) {
        if (Array.isArray(typeArg)) {
          type = typeArg[0];
          isArray = true;
        } else {
          type = typeArg;
        }
      }
    } else {
      status = statusOrOptions.status;
      description = statusOrOptions.description;
      if (statusOrOptions.type) {
        if (Array.isArray(statusOrOptions.type)) {
          type = statusOrOptions.type[0];
          isArray = true;
        } else {
          type = statusOrOptions.type;
        }
      }
      headers = statusOrOptions.headers;
    }

    const metadata: ApiResponseMetadata = {
      target: target.constructor as Function,
      methodName: propertyKey as string,
      status,
      description,
      type,
      isArray,
    };

    metadataStorage.addResponse(metadata);

    if (headers) {
      metadataStorage.addResponseHeaders({
        target: target.constructor as Function,
        methodName: propertyKey as string,
        status,
        headers,
      });
    }
  };
}
