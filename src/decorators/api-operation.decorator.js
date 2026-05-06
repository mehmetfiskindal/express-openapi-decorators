"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiOperation = ApiOperation;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
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
function ApiOperation(options) {
    return (target, propertyKey, _descriptor) => {
        const metadata = {
            target: target.constructor,
            methodName: propertyKey,
            summary: options.summary,
            description: options.description,
            operationId: options.operationId,
            deprecated: options.deprecated ?? false,
        };
        metadata_storage_js_1.metadataStorage.addOperation(metadata);
    };
}
