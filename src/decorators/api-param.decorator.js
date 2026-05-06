"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiParam = ApiParam;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
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
function ApiParam(options) {
    return (target, propertyKey, _descriptor) => {
        const metadata = {
            target: target.constructor,
            methodName: propertyKey,
            name: options.name,
            type: options.type ?? String,
            required: options.required ?? true,
            description: options.description,
            example: options.example,
        };
        metadata_storage_js_1.metadataStorage.addPathParam(metadata);
    };
}
