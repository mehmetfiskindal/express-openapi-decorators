import type { OpenAPIV3, OpenAPIV3_1, OpenApiVersion } from '../types/openapi.types.js';
import { generateSchemas, generateSchemasV31 } from './schema-generator.js';
import { generatePaths, generatePathsV31 } from './path-generator.js';
import { metadataStorage } from '../metadata/metadata-storage.js';

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
   * @default '3.1.0'
   */
  openapi?: OpenApiVersion;

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
 * Create OpenAPI document from decorated controllers
 * Supports both OpenAPI 3.0.3 and 3.1.0
 *
 * @example
 * ```typescript
 * import { createOpenApiDocument } from 'express-openapi-decorators';
 * import { UserController } from './controllers/user.controller';
 *
 * const document = createOpenApiDocument({
 *   openapi: '3.1.0', // or '3.0.3' (default is '3.1.0')
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
export function createOpenApiDocument<T extends OpenApiVersion = '3.1.0'>(
  options: CreateOpenApiDocumentOptions & { openapi?: T }
): T extends '3.0.3' ? OpenAPIV3.Document : OpenAPIV3_1.Document {
  const version = options.openapi ?? '3.1.0';

  if (version === '3.0.3') {
    return createOpenApiDocumentV30(options) as T extends '3.0.3' ? OpenAPIV3.Document : OpenAPIV3_1.Document;
  }

  return createOpenApiDocumentV31(options) as T extends '3.0.3' ? OpenAPIV3.Document : OpenAPIV3_1.Document;
}

/**
 * Generate security schemes for OpenAPI 3.0
 */
function generateSecuritySchemesV30(): Record<string, OpenAPIV3.SecuritySchemeObject> | undefined {
  const schemes = metadataStorage.getSecuritySchemes();
  if (schemes.length === 0) return undefined;

  const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {};

  for (const scheme of schemes) {
    switch (scheme.type) {
      case 'http': {
        const httpScheme: OpenAPIV3.HttpSecurityScheme = {
          type: 'http',
          scheme: scheme.scheme!,
        };
        if (scheme.bearerFormat !== undefined) {
          httpScheme.bearerFormat = scheme.bearerFormat;
        }
        if (scheme.description !== undefined) {
          httpScheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = httpScheme;
        break;
      }
      case 'apiKey': {
        const apiKeyScheme: OpenAPIV3.ApiKeySecurityScheme = {
          type: 'apiKey',
          in: scheme.in!,
          name: scheme.name,
        };
        if (scheme.description !== undefined) {
          apiKeyScheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = apiKeyScheme;
        break;
      }
      case 'oauth2': {
        const oauth2Scheme: OpenAPIV3.OAuth2SecurityScheme = {
          type: 'oauth2',
          flows: scheme.flows!,
        };
        if (scheme.description !== undefined) {
          oauth2Scheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = oauth2Scheme;
        break;
      }
      case 'openIdConnect': {
        const openIdScheme: OpenAPIV3.OpenIdSecurityScheme = {
          type: 'openIdConnect',
          openIdConnectUrl: scheme.openIdConnectUrl!,
        };
        if (scheme.description !== undefined) {
          openIdScheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = openIdScheme;
        break;
      }
    }
  }

  return securitySchemes;
}

/**
 * Generate security schemes for OpenAPI 3.1
 */
function generateSecuritySchemesV31(): Record<string, OpenAPIV3_1.SecuritySchemeObject> | undefined {
  const schemes = metadataStorage.getSecuritySchemes();
  if (schemes.length === 0) return undefined;

  const securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject> = {};

  for (const scheme of schemes) {
    switch (scheme.type) {
      case 'http': {
        const httpScheme: OpenAPIV3_1.HttpSecurityScheme = {
          type: 'http',
          scheme: scheme.scheme!,
        };
        if (scheme.bearerFormat !== undefined) {
          httpScheme.bearerFormat = scheme.bearerFormat;
        }
        if (scheme.description !== undefined) {
          httpScheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = httpScheme;
        break;
      }
      case 'apiKey': {
        const apiKeyScheme: OpenAPIV3_1.ApiKeySecurityScheme = {
          type: 'apiKey',
          in: scheme.in!,
          name: scheme.name,
        };
        if (scheme.description !== undefined) {
          apiKeyScheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = apiKeyScheme;
        break;
      }
      case 'oauth2': {
        const oauth2Scheme: OpenAPIV3_1.OAuth2SecurityScheme = {
          type: 'oauth2',
          flows: scheme.flows!,
        };
        if (scheme.description !== undefined) {
          oauth2Scheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = oauth2Scheme;
        break;
      }
      case 'openIdConnect': {
        const openIdScheme: OpenAPIV3_1.OpenIdSecurityScheme = {
          type: 'openIdConnect',
          openIdConnectUrl: scheme.openIdConnectUrl!,
        };
        if (scheme.description !== undefined) {
          openIdScheme.description = scheme.description;
        }
        securitySchemes[scheme.name] = openIdScheme;
        break;
      }
    }
  }

  return securitySchemes;
}

/**
 * Create OpenAPI 3.0.3 document
 */
function createOpenApiDocumentV30(
  options: CreateOpenApiDocumentOptions
): OpenAPIV3.Document {
  const document: OpenAPIV3.Document = {
    openapi: '3.0.3',
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
    // Add security schemes
    const securitySchemes = generateSecuritySchemesV30();
    if (securitySchemes) {
      document.components.securitySchemes = securitySchemes;
    }
  }

  return document;
}

/**
 * Create OpenAPI 3.1.0 document
 */
function createOpenApiDocumentV31(
  options: CreateOpenApiDocumentOptions
): OpenAPIV3_1.Document {
  const document: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: options.title,
      version: options.version,
    },
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
  document.paths = generatePathsV31(options.controllers);

  // Generate schemas from DTOs
  if (document.components) {
    document.components.schemas = generateSchemasV31();
    // Add security schemes
    const securitySchemes = generateSecuritySchemesV31();
    if (securitySchemes) {
      document.components.securitySchemes = securitySchemes;
    }
  }

  return document;
}
