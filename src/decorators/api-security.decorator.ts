import { metadataStorage } from '../metadata/metadata-storage.js';
import type { OAuthFlowsObject } from '../metadata/metadata-types.js';

/**
 * Options for API key security scheme
 */
export interface ApiKeyOptions {
  /** API key name */
  name: string;
  /** Location of the API key */
  in: 'query' | 'header' | 'cookie';
  /** Description of the security scheme */
  description?: string;
}

/**
 * Options for OAuth2 security scheme
 */
export interface OAuth2Options {
  /** OAuth2 flows configuration */
  flows: OAuthFlowsObject;
  /** Description of the security scheme */
  description?: string;
}

/**
 * Options for OpenID Connect security scheme
 */
export interface OpenIdConnectOptions {
  /** OpenID Connect discovery URL */
  url: string;
  /** Description of the security scheme */
  description?: string;
}

/**
 * Register a Bearer token (JWT) security scheme
 * @param name - Name of the security scheme (default: 'bearer')
 * @param options - Optional bearer format and description
 * @returns Class or method decorator
 * 
 * @example
 * ```typescript
 * // Controller level - applies to all routes
 * @ApiBearerAuth()
 * @Controller('/users')
 * class UserController {}
 * 
 * // Method level - applies to specific route
 * @Controller('/public')
 * class PublicController {
 *   @ApiBearerAuth()
 *   @Get('/profile')
 *   getProfile() {}
 * }
 * ```
 */
export function ApiBearerAuth(
  name: string = 'bearer',
  options?: { bearerFormat?: string; description?: string }
): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    // Register the security scheme
    metadataStorage.addSecurityScheme({
      name,
      apiKeyName: undefined,
      type: 'http',
      scheme: 'bearer',
      bearerFormat: options?.bearerFormat ?? 'JWT',
      description: options?.description,
      in: undefined,
      flows: undefined,
      openIdConnectUrl: undefined,
    });

    // Add security requirement
    if (typeof target === 'function' && !propertyKey) {
      // Class decorator - applies to all methods
      metadataStorage.addSecurityRequirement({
        target,
        schemes: [name],
      });
    } else if (propertyKey) {
      // Method decorator
      metadataStorage.addSecurityRequirement({
        target: target.constructor,
        methodName: propertyKey as string,
        schemes: [name],
      });
    }
  } as ClassDecorator & MethodDecorator;
}

/**
 * Register a Basic HTTP authentication security scheme
 * @param name - Name of the security scheme (default: 'basic')
 * @param description - Optional description
 * @returns Class or method decorator
 * 
 * @example
 * ```typescript
 * @ApiBasicAuth()
 * @Controller('/admin')
 * class AdminController {}
 * ```
 */
export function ApiBasicAuth(
  name: string = 'basic',
  description?: string
): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    // Register the security scheme
    metadataStorage.addSecurityScheme({
      name,
      apiKeyName: undefined,
      type: 'http',
      scheme: 'basic',
      description,
      bearerFormat: undefined,
      in: undefined,
      flows: undefined,
      openIdConnectUrl: undefined,
    });

    // Add security requirement
    if (typeof target === 'function' && !propertyKey) {
      metadataStorage.addSecurityRequirement({
        target,
        schemes: [name],
      });
    } else if (propertyKey) {
      metadataStorage.addSecurityRequirement({
        target: target.constructor,
        methodName: propertyKey as string,
        schemes: [name],
      });
    }
  } as ClassDecorator & MethodDecorator;
}

/**
 * Register an API key security scheme
 * @param name - Name of the security scheme
 * @param options - API key options (name, location, description)
 * @returns Class or method decorator
 * 
 * @example
 * ```typescript
 * @ApiApiKey('apiKey', { name: 'X-API-Key', in: 'header' })
 * @Controller('/api')
 * class ApiController {}
 * ```
 */
export function ApiApiKey(
  name: string,
  options: ApiKeyOptions
): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    // Register the security scheme
    metadataStorage.addSecurityScheme({
      name,
      apiKeyName: options.name,
      type: 'apiKey',
      in: options.in,
      description: options.description,
      scheme: undefined,
      bearerFormat: undefined,
      flows: undefined,
      openIdConnectUrl: undefined,
    });

    // Add security requirement
    if (typeof target === 'function' && !propertyKey) {
      metadataStorage.addSecurityRequirement({
        target,
        schemes: [name],
      });
    } else if (propertyKey) {
      metadataStorage.addSecurityRequirement({
        target: target.constructor,
        methodName: propertyKey as string,
        schemes: [name],
      });
    }
  } as ClassDecorator & MethodDecorator;
}

/**
 * Register an OAuth2 security scheme
 * @param name - Name of the security scheme (default: 'oauth2')
 * @param options - OAuth2 configuration options
 * @returns Class or method decorator
 * 
 * @example
 * ```typescript
 * @ApiOAuth2('oauth2', {
 *   flows: {
 *     authorizationCode: {
 *       authorizationUrl: 'https://example.com/oauth/authorize',
 *       tokenUrl: 'https://example.com/oauth/token',
 *       scopes: {
 *         read: 'Read access',
 *         write: 'Write access'
 *       }
 *     }
 *   }
 * })
 * @Controller('/oauth')
 * class OAuthController {}
 * ```
 */
export function ApiOAuth2(
  name: string = 'oauth2',
  options: OAuth2Options
): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    // Register the security scheme
    metadataStorage.addSecurityScheme({
      name,
      apiKeyName: undefined,
      type: 'oauth2',
      flows: options.flows,
      description: options.description,
      scheme: undefined,
      bearerFormat: undefined,
      in: undefined,
      openIdConnectUrl: undefined,
    });

    // Add security requirement
    if (typeof target === 'function' && !propertyKey) {
      metadataStorage.addSecurityRequirement({
        target,
        schemes: [name],
      });
    } else if (propertyKey) {
      metadataStorage.addSecurityRequirement({
        target: target.constructor,
        methodName: propertyKey as string,
        schemes: [name],
      });
    }
  } as ClassDecorator & MethodDecorator;
}

/**
 * Register an OpenID Connect security scheme
 * @param name - Name of the security scheme (default: 'openIdConnect')
 * @param options - OpenID Connect configuration
 * @returns Class or method decorator
 * 
 * @example
 * ```typescript
 * @ApiOpenIdConnect('oidc', {
 *   url: 'https://example.com/.well-known/openid-configuration'
 * })
 * @Controller('/oidc')
 * class OidcController {}
 * ```
 */
export function ApiOpenIdConnect(
  name: string = 'openIdConnect',
  options: OpenIdConnectOptions
): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    // Register the security scheme
    metadataStorage.addSecurityScheme({
      name,
      apiKeyName: undefined,
      type: 'openIdConnect',
      openIdConnectUrl: options.url,
      description: options.description,
      scheme: undefined,
      bearerFormat: undefined,
      in: undefined,
      flows: undefined,
    });

    // Add security requirement
    if (typeof target === 'function' && !propertyKey) {
      metadataStorage.addSecurityRequirement({
        target,
        schemes: [name],
      });
    } else if (propertyKey) {
      metadataStorage.addSecurityRequirement({
        target: target.constructor,
        methodName: propertyKey as string,
        schemes: [name],
      });
    }
  } as ClassDecorator & MethodDecorator;
}

/**
 * Generic security decorator that can reference any registered security scheme
 * @param names - Names of security schemes to apply
 * @returns Class or method decorator
 *
 * @example
 * ```typescript
 * // Apply single scheme
 * @ApiSecurity('bearer')
 * @Get('/protected')
 * protectedRoute() {}
 *
 * // Apply multiple schemes (AND logic - all required)
 * @ApiSecurity('bearer', 'apiKey')
 * @Get('/double-protected')
 * doubleProtectedRoute() {}
 * ```
 */
export function ApiSecurity(...names: string[]): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    // Add security requirement (security scheme must be registered separately)
    if (typeof target === 'function' && !propertyKey) {
      metadataStorage.addSecurityRequirement({
        target,
        schemes: names,
      });
    } else if (propertyKey) {
      metadataStorage.addSecurityRequirement({
        target: target.constructor,
        methodName: propertyKey as string,
        schemes: names,
      });
    }
  } as ClassDecorator & MethodDecorator;
}

/**
 * Alias for @ApiSecurity decorator
 * Simpler syntax for applying security schemes
 *
 * @example
 * ```typescript
 * // Apply single scheme
 * @Security('bearerAuth')
 * @Get('/protected')
 * protectedRoute() {}
 *
 * // Apply multiple schemes
 * @Security('bearerAuth', 'apiKey')
 * @Get('/double-protected')
 * doubleProtectedRoute() {}
 * ```
 */
export const Security = ApiSecurity;

/**
 * Explicitly mark a route as having no security (public endpoint)
 * This overrides controller-level security
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @ApiBearerAuth()
 * @Controller('/users')
 * class UserController {
 *   @Public()
 *   @Get('/public-info')
 *   publicInfo() {} // No authentication required
 *
 *   @Get('/private-info')
 *   privateInfo() {} // Requires bearer token
 * }
 * ```
 */
export function Public(): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    metadataStorage.addSecurityRequirement({
      target: target.constructor,
      methodName: propertyKey as string,
      schemes: [], // Empty array means no security required
    });
  };
}

/**
 * Register a cookie-based security scheme.
 * Internally registers an `apiKey` security scheme with `in: 'cookie'`
 * and applies it to the route or controller as a security requirement.
 * This is a sugar around `@ApiApiKey({ in: 'cookie' })`.
 *
 * @param name - Name of the security scheme (default: 'cookie')
 * @param options - Cookie options
 * @returns Class or method decorator
 *
 * @example
 * ```typescript
 * // Default: registers a scheme named 'cookie'
 * @ApiCookieAuth()
 * @Controller('/profile')
 * class ProfileController {}
 *
 * // Custom name and cookie name
 * @ApiCookieAuth('session', { name: 'connect.sid', description: 'Express session' })
 * @Controller('/dashboard')
 * class DashboardController {}
 * ```
 */
export function ApiCookieAuth(
  name: string = 'cookie',
  options?: { name?: string; description?: string }
): ClassDecorator & MethodDecorator {
  return function (target: Function | Object, propertyKey?: string | symbol) {
    const cookieName = options?.name ?? name;

    metadataStorage.addSecurityScheme({
      name,
      apiKeyName: cookieName,
      type: 'apiKey',
      in: 'cookie',
      description: options?.description,
      scheme: undefined,
      bearerFormat: undefined,
      flows: undefined,
      openIdConnectUrl: undefined,
    });

    if (typeof target === 'function' && !propertyKey) {
      metadataStorage.addSecurityRequirement({
        target,
        schemes: [name],
      });
    } else if (propertyKey) {
      metadataStorage.addSecurityRequirement({
        target: target.constructor,
        methodName: propertyKey as string,
        schemes: [name],
      });
    }
  } as ClassDecorator & MethodDecorator;
}
