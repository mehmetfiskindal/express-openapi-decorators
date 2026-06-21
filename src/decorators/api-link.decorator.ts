import { metadataStorage } from '../metadata/metadata-storage.js';

/**
 * Options for @ApiLink
 */
export interface ApiLinkOptions {
  /**
   * Source DTO class. The decorator reads the field on this type to
   * produce the link's `operationRef` parameter map.
   */
  from: Function;

  /**
   * Name of the field on `from` whose value is used as the link parameter.
   * @default 'id'
   */
  fromField?: string;

  /**
   * Name of the path parameter in the decorated operation that
   * receives the value from `fromField`.
   */
  routeParam: string;
}

/**
 * @ApiLink — declares that the decorated operation is the default
 * getter for a resource. Combined with `@ApiDefaultGetter` on the
 * inverse side, this lets OpenAPI tooling generate link objects
 * connecting one operation to another.
 *
 * Mirrors the `@nestjs/swagger` `@ApiLink` decorator.
 *
 * @example
 * ```typescript
 * class User {
 *   @ApiProperty() id!: string;
 * }
 *
 * @Controller('/users')
 * class UserController {
 *   @Get(':userId/documents')
 *   @ApiLink({ from: User, fromField: 'id', routeParam: 'userId' })
 *   getDocuments() {}
 * }
 * ```
 */
export function ApiLink(options: ApiLinkOptions): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    metadataStorage.addLink({
      target: target.constructor,
      methodName: propertyKey as string,
      fromType: options.from,
      fromField: options.fromField ?? 'id',
      routeParam: options.routeParam,
    });
  };
}

/**
 * @ApiDefaultGetter — marks the decorated operation as the default
 * route for retrieving an instance of a given DTO. The metadata is
 * used by `@ApiLink` so that OpenAPI tools can produce
 * `links` entries pointing back to this operation.
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get(':id')
 *   @ApiDefaultGetter(User)
 *   getById() {}
 * }
 * ```
 */
export function ApiDefaultGetter(_type: Function): MethodDecorator {
  // For now, this is a no-op marker. The information is implicit in
  // the combination of @ApiLink + this decorator on the inverse side.
  // We keep the decorator for forward-compatibility and DX parity
  // with @nestjs/swagger.
  return (_target: Object, _propertyKey: string | symbol) => {
    // intentionally empty
  };
}
