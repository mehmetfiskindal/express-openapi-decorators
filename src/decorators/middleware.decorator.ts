import { metadataStorage } from '../metadata/metadata-storage.js';
import type { MiddlewareReference } from '../metadata/metadata-types.js';

/**
 * Middleware decorator - applies middleware to controllers or methods
 * @param middlewares - Middleware functions or string references to apply
 * @returns Class or method decorator
 * 
 * @example
 * ```typescript
 * // Controller-level middleware
 * @Use(authMiddleware)
 * @Controller('/users')
 * class UserController {
 *   // Method-level middleware
 *   @Use(validateCreateUser)
 *   @Post('/')
 *   createUser() {}
 * }
 * 
 * // Multiple middlewares
 * @Use(rateLimiter, loggingMiddleware)
 * @Get('/')
 * getAll() {}
 * 
 * // String-based middleware references (requires namedMiddlewares in createRouterFromControllers)
 * @Middleware('auth')
 * @Get('/protected')
 * getProtected() {}
 * 
 * @Middleware('roles:admin')
 * @Get('/admin')
 * getAdminData() {}
 * ```
 */
export function Use(...middlewares: MiddlewareReference[]): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    if (typeof target === 'function' && !propertyKey) {
      // Class decorator - applies to all methods
      metadataStorage.addMiddleware({
        target,
        middlewares,
      });
    } else if (propertyKey) {
      // Method decorator
      metadataStorage.addMiddleware({
        target: target.constructor,
        methodName: propertyKey as string,
        middlewares,
      });
    }
  } as ClassDecorator & MethodDecorator;
}

/**
 * Alias for @Use decorator
 * Supports both function middlewares and string references
 * 
 * @example
 * ```typescript
 * // With string reference (requires namedMiddlewares configuration)
 * @Middleware('auth')
 * @Get('/profile')
 * getProfile() {}
 * 
 * // With multiple middlewares
 * @Middleware('auth', 'roles:admin')
 * @Get('/admin')
 * getAdminData() {}
 * 
 * // With function middlewares
 * @Middleware(rateLimiter, authMiddleware)
 * @Get('/data')
 * getData() {}
 * ```
 */
export const Middleware = Use;
