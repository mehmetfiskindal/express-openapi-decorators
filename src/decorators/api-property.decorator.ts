import 'reflect-metadata';
import { metadataStorage, MetadataKeys } from '../metadata/metadata-storage.js';
import type { ApiPropertyMetadata } from '../metadata/metadata-types.js';

/**
 * Options for @ApiProperty decorator
 */
export interface ApiPropertyOptions {
  /**
   * Property type
   * Can be a primitive constructor (String, Number, Boolean) or a DTO class
   * For arrays, use: type: [UserDto]
   */
  type?: Function | [Function];

  /**
   * Example value for the property
   */
  example?: unknown;

  /**
   * Description of the property
   */
  description?: string;

  /**
   * Whether the property is required
   * @default true
   */
  required?: boolean;

  /**
   * Enum values (if property is an enum)
   */
  enum?: unknown[];

  /**
   * Format of the property (e.g., 'email', 'date-time', 'uuid')
   */
  format?: string;

  /**
   * Default value
   */
  default?: unknown;

  /**
   * Whether this property is an array
   * Automatically set to true if type is an array
   */
  isArray?: boolean;
}

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
export function ApiProperty(options: ApiPropertyOptions = {}): PropertyDecorator {
  return (target, propertyKey) => {
    if (!target) {
      throw new Error(`@ApiProperty decorator requires a valid target. Make sure 'experimentalDecorators' and 'emitDecoratorMetadata' are enabled in tsconfig.json`);
    }
    const targetClass = target.constructor as Function;

    // Try to get design:type from reflect-metadata
    const designType: Function | undefined = Reflect.getMetadata(
      MetadataKeys.DESIGN_TYPE,
      target,
      propertyKey
    );

    // Determine the final type
    let type: Function | [Function] | undefined = options.type;
    let isArray = options.isArray ?? false;

    if (!type) {
      // If no explicit type, try to infer from design:type
      if (designType) {
        if (designType === Array) {
          // For arrays inferred from design:type, attempt to read the element
          // type from design:paramtypes so the schema can still emit a useful
          // `items` reference. If the element type cannot be determined we
          // fall back to `Object` to keep the schema valid.
          isArray = true;
          const paramTypes = Reflect.getMetadata(
            MetadataKeys.DESIGN_PARAM_TYPES,
            target,
            propertyKey
          ) as unknown[] | undefined;
          const inner = Array.isArray(paramTypes) ? paramTypes[0] : undefined;
          if (inner && typeof inner === 'function') {
            type = inner as Function;
          } else {
            // Leave `type` undefined; schema-generator.ts emits a safe
            // `{ type: 'object' }` item when both type and isArray are
            // present but no element type is known.
            type = undefined;
          }
        } else {
          type = designType;
        }
      }
    } else {
      // Check if type is an array
      if (Array.isArray(type)) {
        isArray = true;
        type = type[0];
      }
    }

    const metadata: ApiPropertyMetadata = {
      target: targetClass,
      propertyKey: propertyKey as string,
      type,
      example: options.example,
      description: options.description,
      required: options.required ?? true,
      enum: options.enum,
      format: options.format,
      default: options.default,
      isArray,
    };

    metadataStorage.addProperty(metadata);
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
export function ApiPropertyOptional(options: Omit<ApiPropertyOptions, 'required'> = {}): PropertyDecorator {
  return ApiProperty({
    ...options,
    required: false,
  });
}
