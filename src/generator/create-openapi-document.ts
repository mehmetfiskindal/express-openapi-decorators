import type { OpenAPIV3 } from '../types/openapi.types.js';
import { generateSchemas } from './schema-generator.js';
import { generatePaths } from './path-generator.js';

/**
 * Server configuration for OpenAPI document
 */
export interface OpenApiServer {
  url: string;
  description?: string;
}

/**
 * Options for creating OpenAPI document
 */
export interface CreateOpenApiDocumentOptions {
  /**
   * OpenAPI version
   * @default '3.0.3'
   */
  openapi?: string;

  /**
   * API title
   */
  title: string;

  /**
   * API description
   */
  description?: string;

  /**
   * API version
   */
  version: string;

  /**
   * API servers
   */
  servers?: OpenApiServer[];

  /**
   * Controller classes to include in the documentation
   */
  controllers: Function[];

  /**
   * Contact information
   */
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };

  /**
   * License information
   */
  license?: {
    name: string;
    url?: string;
  };
}

/**
 * Create OpenAPI 3.0.3 document from decorated controllers
 * 
 * @example
 * ```typescript
 * import { createOpenApiDocument } from 'express-openapi-decorators';
 * import { UserController } from './controllers/user.controller';
 * 
 * const document = createOpenApiDocument({
 *   title: 'My API',
 *   version: '1.0.0',
 *   description: 'API documentation for my application',
 *   controllers: [UserController],
 *   servers: [
 *     { url: 'http://localhost:3000', description: 'Local server' }
 *   ]
 * });
 * 
 * // Use with swagger-ui-express
 * app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
 * ```
 */
export function createOpenApiDocument(
  options: CreateOpenApiDocumentOptions
): OpenAPIV3.Document {
  const document: OpenAPIV3.Document = {
    openapi: options.openapi ?? '3.0.3',
    info: {
      title: options.title,
      version: options.version,
    },
    paths: {},
    components: {
      schemas: {},
    },
  };

  // Add optional info fields
  if (options.description) {
    document.info.description = options.description;
  }

  if (options.contact) {
    document.info.contact = options.contact;
  }

  if (options.license) {
    document.info.license = options.license;
  }

  // Add servers if provided
  if (options.servers && options.servers.length > 0) {
    document.servers = options.servers;
  }

  // Generate paths from controllers
  document.paths = generatePaths(options.controllers);

  // Generate schemas from DTOs
  if (document.components) {
    document.components.schemas = generateSchemas();
  }

  return document;
}
