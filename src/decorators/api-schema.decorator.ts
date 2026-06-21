import { metadataStorage } from '../metadata/metadata-storage.js';

/**
 * @ApiSchema — override the schema name used for a DTO class in
 * `components.schemas`. Useful when the runtime class name should not
 * be exposed in the public OpenAPI document (e.g. internal class
 * names or naming conventions that differ from the public contract).
 *
 * @example
 * ```typescript
 * @ApiSchema({ name: 'User' })
 * class InternalUserDto {
 *   @ApiProperty()
 *   id!: string;
 * }
 * ```
 *
 * The generated document will reference `#/components/schemas/User`
 * instead of `#/components/schemas/InternalUserDto`.
 */
export function ApiSchema(options: { name: string }): ClassDecorator {
  return (target: Function) => {
    metadataStorage.addSchemaName({
      target,
      name: options.name,
    });
  };
}
