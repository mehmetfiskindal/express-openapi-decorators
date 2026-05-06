import { metadataStorage } from '../metadata/metadata-storage.js';
import type { MiddlewareFunction } from '../metadata/metadata-types.js';

/**
 * Middleware decorator - applies middleware to controllers or methods
 * @param middlewares - Middleware functions to apply
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
 * ```
 */
export function Use(...middlewares: MiddlewareFunction[]): ClassDecorator & MethodDecorator {
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
