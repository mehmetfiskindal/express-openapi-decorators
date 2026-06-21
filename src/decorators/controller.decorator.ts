import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ControllerMetadata } from '../metadata/metadata-types.js';

/**
 * Options for @Controller decorator
 */
export interface ControllerOptions {
  /**
   * Base path for all routes in this controller
   * @default '/'
   */
  path?: string;
}

/**
 * Controller decorator - marks a class as an API controller
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * export class UserController {
 *   // routes...
 * }
 *
 * // Argument-less form: defaults to base path '/'
 * @Controller
 * export class RootController {}
 * ```
 */
export function Controller(path: string): ClassDecorator;
export function Controller(options?: ControllerOptions): ClassDecorator;
export function Controller(
  pathOrOptions?: string | ControllerOptions
): ClassDecorator {
  return (target) => {
    const path =
      typeof pathOrOptions === 'string'
        ? pathOrOptions
        : (pathOrOptions?.path ?? '/');

    const metadata: ControllerMetadata = {
      target: target as unknown as Function,
      basePath: normalizePath(path),
    };

    metadataStorage.addController(metadata);
  };
}

/**
 * Normalize a path to ensure it starts with '/' and doesn't end with '/'
 */
function normalizePath(path: string): string {
  // Ensure path starts with '/'
  let normalized = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slash (except for root '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}
