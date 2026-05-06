import { metadataStorage } from '../metadata/metadata-storage.js';
import type { HttpMethod, MethodMetadata } from '../metadata/metadata-types.js';

/**
 * HTTP method decorator factory
 */
function createHttpMethodDecorator(httpMethod: HttpMethod) {
  return (path: string = '/'): MethodDecorator => {
    return (target, propertyKey, _descriptor) => {
      // Get the class constructor from the prototype
      const controllerTarget = (target as object).constructor as Function;

      const metadata: MethodMetadata = {
        target: target.constructor as Function,
        methodName: propertyKey as string,
        httpMethod,
        path: normalizeMethodPath(path),
        controllerTarget,
      };

      metadataStorage.addMethod(metadata);
    };
  };
}

/**
 * @Get decorator - marks a method as a GET endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   getUsers() {}
 *   
 *   @Get('/:id')
 *   getUser() {}
 * }
 * ```
 */
export const Get = createHttpMethodDecorator('get');

/**
 * @Post decorator - marks a method as a POST endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Post('/')
 *   createUser() {}
 * }
 * ```
 */
export const Post = createHttpMethodDecorator('post');

/**
 * @Put decorator - marks a method as a PUT endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Put('/:id')
 *   updateUser() {}
 * }
 * ```
 */
export const Put = createHttpMethodDecorator('put');

/**
 * @Patch decorator - marks a method as a PATCH endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Patch('/:id')
 *   partialUpdateUser() {}
 * }
 * ```
 */
export const Patch = createHttpMethodDecorator('patch');

/**
 * @Delete decorator - marks a method as a DELETE endpoint
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Delete('/:id')
 *   deleteUser() {}
 * }
 * ```
 */
export const Delete = createHttpMethodDecorator('delete');

/**
 * Normalize a method path
 */
function normalizeMethodPath(path: string): string {
  // Ensure path starts with '/'
  let normalized = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slash (except for root '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}
