"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTags = ApiTags;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
/**
 * @ApiTags decorator - adds OpenAPI tags to a controller
 *
 * @example
 * ```typescript
 * @ApiTags('Users', 'Admin')
 * @Controller('/users')
 * export class UserController {
 *   // All endpoints will have 'Users' and 'Admin' tags
 * }
 * ```
 */
function ApiTags(...tags) {
    return (target) => {
        const metadata = {
            target: target,
            tags,
        };
        metadata_storage_js_1.metadataStorage.addTags(metadata);
    };
}
