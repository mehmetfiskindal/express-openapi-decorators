import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ApiTagsMetadata } from '../metadata/metadata-types.js';

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
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target) => {
    const metadata: ApiTagsMetadata = {
      target: target as unknown as Function,
      tags,
    };

    metadataStorage.addTags(metadata);
  };
}
