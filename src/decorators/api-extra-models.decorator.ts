import { metadataStorage } from '../metadata/metadata-storage.js';

/**
 * @ApiExtraModels — register one or more DTO classes so they are
 * emitted in `components.schemas` even when no operation references
 * them directly. Mirrors `@nestjs/swagger` behaviour.
 *
 * Useful for polymorphic types referenced via `oneOf` / `anyOf`, error
 * envelopes shared across multiple endpoints, or DTOs that are
 * documented for SDK generation but not directly returned by any
 * current route.
 *
 * @example
 * ```typescript
 * @ApiExtraModels(ErrorEnvelope, PaginationMeta)
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   @ApiResponse({ status: 200, type: [UserDto] })
 *   list() {}
 * }
 * ```
 */
export function ApiExtraModels(...models: Function[]): ClassDecorator & MethodDecorator {
  return function (_target: Function | Object, _propertyKey?: string | symbol) {
    for (const model of models) {
      if (typeof model === 'function') {
        metadataStorage.addExtraModel(model);
      }
    }
  };
}
