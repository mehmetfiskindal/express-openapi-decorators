"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiQuery = ApiQuery;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
/**
 * @ApiQuery decorator - adds query parameter metadata to an endpoint
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Get('/')
 *   @ApiQuery({
 *     name: 'page',
 *     type: Number,
 *     required: false,
 *     example: 1,
 *     description: 'Page number'
 *   })
 *   @ApiQuery({
 *     name: 'limit',
 *     type: Number,
 *     required: false,
 *     example: 10,
 *     description: 'Items per page'
 *   })
 *   listUsers() {}
 * }
 * ```
 */
function ApiQuery(options) {
    return (target, propertyKey, _descriptor) => {
        const metadata = {
            target: target.constructor,
            methodName: propertyKey,
            name: options.name,
            type: options.type,
            required: options.required ?? false,
            description: options.description,
            example: options.example,
        };
        metadata_storage_js_1.metadataStorage.addQueryParam(metadata);
    };
}
