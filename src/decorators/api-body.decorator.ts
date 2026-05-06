import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ApiBodyMetadata } from '../metadata/metadata-types.js';

/**
 * Options for @ApiBody decorator
 */
export interface ApiBodyOptions {
  /**
   * DTO class defining the request body schema
   */
  type: Function;

  /**
   * Whether the body is required
   * @default true
   */
  required?: boolean;

  /**
   * Description of the request body
   */
  description?: string;
}

/**
 * @ApiBody decorator - specifies the request body schema for an endpoint
 * 
 * Can be used in two ways:
 * 1. Simple: @ApiBody(CreateUserDto)
 * 2. Detailed: @ApiBody({ type: CreateUserDto, required: true, description: 'User data' })
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   @Post('/')
 *   @ApiBody(CreateUserDto)
 *   createUser() {}
 *   
 *   @Post('/bulk')
 *   @ApiBody({
 *     type: CreateUserDto,
 *     required: true,
 *     description: 'Array of users to create'
 *   })
 *   createUsers() {}
 * }
 * ```
 */
export function ApiBody(type: Function): MethodDecorator;
export function ApiBody(options: ApiBodyOptions): MethodDecorator;
export function ApiBody(typeOrOptions: Function | ApiBodyOptions): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    let type: Function;
    let required = true;
    let description: string | undefined;

    if (typeof typeOrOptions === 'function') {
      type = typeOrOptions;
    } else {
      type = typeOrOptions.type;
      required = typeOrOptions.required ?? true;
      description = typeOrOptions.description;
    }

    const metadata: ApiBodyMetadata = {
      target: target.constructor as Function,
      methodName: propertyKey as string,
      type,
      required,
      description,
    };

    metadataStorage.addBodyParam(metadata);
  };
}
