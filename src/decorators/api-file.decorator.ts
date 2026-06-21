import { metadataStorage } from '../metadata/metadata-storage.js';

/**
 * Options for file upload decorator
 */
export interface ApiFileOptions {
  /** Field name for the file upload */
  name?: string;
  /** Whether the file is required */
  required?: boolean;
  /** Description of the file field */
  description?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types (e.g., ['image/jpeg', 'image/png']) */
  allowedMimeTypes?: string[];
}

/**
 * Options for multiple files upload decorator
 */
export interface ApiFilesOptions extends ApiFileOptions {
  /** Maximum number of files allowed */
  maxCount?: number;
}

/**
 * Single file upload decorator
 * Marks the endpoint as accepting a single file upload
 * @param options - File upload options
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @Controller('/upload')
 * class UploadController {
 *   @ApiFile({ name: 'avatar', required: true, allowedMimeTypes: ['image/jpeg', 'image/png'] })
 *   @Post('/avatar')
 *   uploadAvatar(@UploadedFile() file: Express.Multer.File) {}
 * }
 * ```
 */
export function ApiFile(options: ApiFileOptions = {}): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    metadataStorage.addFileParam({
      target: target.constructor,
      methodName: propertyKey as string,
      name: options.name ?? 'file',
      isArray: false,
      required: options.required ?? true,
      description: options.description,
      maxSize: options.maxSize,
      allowedMimeTypes: options.allowedMimeTypes,
    });
  };
}

/**
 * Multiple files upload decorator
 * Marks the endpoint as accepting multiple file uploads
 * @param options - Files upload options
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @Controller('/upload')
 * class UploadController {
 *   @ApiFiles({ name: 'documents', maxCount: 5, allowedMimeTypes: ['application/pdf'] })
 *   @Post('/documents')
 *   uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {}
 * }
 * ```
 */
export function ApiFiles(options: ApiFilesOptions = {}): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    metadataStorage.addFileParam({
      target: target.constructor,
      methodName: propertyKey as string,
      name: options.name ?? 'files',
      isArray: true,
      required: options.required ?? true,
      description: options.description,
      maxSize: options.maxSize,
      allowedMimeTypes: options.allowedMimeTypes,
    });
  };
}

/**
 * Specify consumed content types for the endpoint
 * Overrides the default 'application/json' content type
 * @param contentTypes - Array of content types (e.g., 'multipart/form-data', 'application/xml')
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @Controller('/api')
 * class ApiController {
 *   @ApiConsumes('multipart/form-data')
 *   @Post('/upload')
 *   uploadFile() {}
 * 
 *   @ApiConsumes('application/xml', 'application/json')
 *   @Post('/xml-or-json')
 *   processData() {}
 * }
 * ```
 */
export function ApiConsumes(...contentTypes: string[]): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    metadataStorage.addConsumes({
      target: target.constructor,
      methodName: propertyKey as string,
      contentTypes,
    });
  };
}

/**
 * Specify produced (response) content types for the endpoint.
 * Defaults to `application/json` when no response has a content type.
 * The first declared content type is used as the response content;
 * additional types are kept available for consumers that need them.
 *
 * @example
 * ```typescript
 * @Controller('/feed')
 * class FeedController {
 *   @ApiProduces('application/xml', 'application/json')
 *   @Get('/')
 *   feed() {}
 * }
 * ```
 */
export function ApiProduces(...contentTypes: string[]): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    metadataStorage.addProduces({
      target: target.constructor,
      methodName: propertyKey as string,
      contentTypes,
    });
  };
}

/**
 * Form data decorator - shorthand for multipart/form-data uploads
 * Combines @ApiConsumes('multipart/form-data') with file support
 * @param options - File upload options (optional)
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * @Controller('/upload')
 * class UploadController {
 *   @ApiFormData({ name: 'avatar' })
 *   @Post('/avatar')
 *   uploadAvatar(@UploadedFile() file: Express.Multer.File) {}
 * }
 * ```
 */
export function ApiFormData(options: ApiFileOptions = {}): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    // Add consumes metadata for multipart/form-data
    metadataStorage.addConsumes({
      target: target.constructor,
      methodName: propertyKey as string,
      contentTypes: ['multipart/form-data'],
    });

    // Add file parameter metadata
    metadataStorage.addFileParam({
      target: target.constructor,
      methodName: propertyKey as string,
      name: options.name ?? 'file',
      isArray: false,
      required: options.required ?? true,
      description: options.description,
      maxSize: options.maxSize,
      allowedMimeTypes: options.allowedMimeTypes,
    });
  };
}
