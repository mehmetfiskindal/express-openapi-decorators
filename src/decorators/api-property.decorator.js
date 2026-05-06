"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiProperty = ApiProperty;
exports.ApiPropertyOptional = ApiPropertyOptional;
require("reflect-metadata");
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
/**
 * @ApiProperty decorator - adds metadata to DTO class properties
 *
 * @example
 * ```typescript
 * export class UserDto {
 *   @ApiProperty({
 *     type: String,
 *     example: 'user_123',
 *     description: 'Unique user identifier'
 *   })
 *   id: string;
 *
 *   @ApiProperty({
 *     type: String,
 *     example: 'Mehmet',
 *     description: 'User name'
 *   })
 *   name: string;
 *
 *   @ApiProperty({
 *     type: Number,
 *     example: 25,
 *     required: false,
 *     description: 'User age'
 *   })
 *   age?: number;
 *
 *   @ApiProperty({
 *     type: [String],
 *     description: 'User roles'
 *   })
 *   roles: string[];
 *
 *   @ApiProperty({
 *     enum: ['active', 'inactive'],
 *     example: 'active',
 *     description: 'User status'
 *   })
 *   status: 'active' | 'inactive';
 *
 *   @ApiProperty({
 *     type: String,
 *     format: 'email',
 *     example: 'user@example.com',
 *     description: 'User email'
 *   })
 *   email: string;
 * }
 * ```
 */
function ApiProperty(options = {}) {
    return (target, propertyKey) => {
        if (!target) {
            throw new Error(`@ApiProperty decorator requires a valid target. Make sure 'experimentalDecorators' and 'emitDecoratorMetadata' are enabled in tsconfig.json`);
        }
        const targetClass = target.constructor;
        // Try to get design:type from reflect-metadata
        const designType = Reflect.getMetadata(metadata_storage_js_1.MetadataKeys.DESIGN_TYPE, target, propertyKey);
        // Determine the final type
        let type = options.type;
        let isArray = options.isArray ?? false;
        if (!type) {
            // If no explicit type, try to infer from design:type
            if (designType) {
                if (designType === Array) {
                    // For arrays, we need explicit type
                    isArray = true;
                }
                else {
                    type = designType;
                }
            }
        }
        else {
            // Check if type is an array
            if (Array.isArray(type)) {
                isArray = true;
                type = type[0];
            }
        }
        const metadata = {
            target: targetClass,
            propertyKey: propertyKey,
            type,
            example: options.example,
            description: options.description,
            required: options.required ?? true,
            enum: options.enum,
            format: options.format,
            default: options.default,
            isArray,
        };
        metadata_storage_js_1.metadataStorage.addProperty(metadata);
    };
}
/**
 * @ApiPropertyOptional decorator - marks a property as optional
 *
 * Shorthand for @ApiProperty({ required: false, ...options })
 *
 * @example
 * ```typescript
 * export class UserDto {
 *   @ApiProperty()
 *   id: string;
 *
 *   @ApiPropertyOptional({ type: String })
 *   nickname?: string;
 * }
 * ```
 */
function ApiPropertyOptional(options = {}) {
    return ApiProperty({
        ...options,
        required: false,
    });
}
