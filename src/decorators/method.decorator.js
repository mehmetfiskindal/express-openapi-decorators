"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delete = exports.Patch = exports.Put = exports.Post = exports.Get = void 0;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
/**
 * HTTP method decorator factory
 */
function createHttpMethodDecorator(httpMethod) {
    return (path = '/') => {
        return (target, propertyKey, _descriptor) => {
            // Get the class constructor from the prototype
            const controllerTarget = target.constructor;
            const metadata = {
                target: target.constructor,
                methodName: propertyKey,
                httpMethod,
                path: normalizeMethodPath(path),
                controllerTarget,
            };
            metadata_storage_js_1.metadataStorage.addMethod(metadata);
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
exports.Get = createHttpMethodDecorator('get');
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
exports.Post = createHttpMethodDecorator('post');
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
exports.Put = createHttpMethodDecorator('put');
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
exports.Patch = createHttpMethodDecorator('patch');
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
exports.Delete = createHttpMethodDecorator('delete');
/**
 * Normalize a method path
 */
function normalizeMethodPath(path) {
    // Ensure path starts with '/'
    let normalized = path.startsWith('/') ? path : `/${path}`;
    // Remove trailing slash (except for root '/')
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}
