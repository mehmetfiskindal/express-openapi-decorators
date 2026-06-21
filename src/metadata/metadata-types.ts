/**
 * Type definitions for OpenAPI metadata storage
 */

/**
 * HTTP methods supported by the library
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * OpenAPI schema types
 */
export type OpenApiSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object';

/**
 * Metadata for @Controller decorator
 */
export interface ControllerMetadata {
  target: Function;
  basePath: string;
  tags?: string[];
}

/**
 * Metadata for HTTP method decorators (@Get, @Post, etc.)
 */
export interface MethodMetadata {
  target: Function;
  methodName: string;
  httpMethod: HttpMethod;
  path: string;
  controllerTarget: Function;
}

/**
 * Metadata for @ApiOperation decorator
 */
export interface ApiOperationMetadata {
  target: Function;
  methodName: string;
  summary: string;
  description: string | undefined;
  operationId: string | undefined;
  deprecated: boolean;
}

/**
 * Metadata for @ApiResponse decorator
 */
export interface ApiResponseMetadata {
  target: Function;
  methodName: string;
  status: number;
  description: string | undefined;
  type: Function | undefined;
  isArray: boolean;
}

/**
 * Metadata for @ApiBody decorator
 */
export interface ApiBodyMetadata {
  target: Function;
  methodName: string;
  type: Function;
  required: boolean;
  description: string | undefined;
}

/**
 * Metadata for @ApiQuery decorator
 */
export interface ApiQueryMetadata {
  target: Function;
  methodName: string;
  name: string;
  type: Function;
  required: boolean;
  description: string | undefined;
  example: unknown;
  format: string | undefined;
  enum: unknown[] | undefined;
  default: unknown;
  deprecated: boolean;
}

/**
 * Metadata for @ApiParam decorator
 */
export interface ApiParamMetadata {
  target: Function;
  methodName: string;
  name: string;
  type: Function;
  required: boolean;
  description: string | undefined;
  example: unknown;
  format: string | undefined;
  enum: unknown[] | undefined;
  default: unknown;
  deprecated: boolean;
}

/**
 * Metadata for @ApiProperty decorator on DTO classes
 */
export interface ApiPropertyMetadata {
  target: Function;
  propertyKey: string;
  type: Function | undefined;
  example: unknown;
  description: string | undefined;
  required: boolean;
  enum: unknown[] | undefined;
  format: string | undefined;
  default: unknown;
  isArray: boolean;
}

/**
 * Metadata for @ApiTags decorator on controllers
 */
export interface ApiTagsMetadata {
  target: Function;
  tags: string[];
}

/**
 * OAuth2 flow configuration
 */
export interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

/**
 * OAuth2 flows configuration
 */
export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

/**
 * Security scheme metadata for @ApiBearerAuth, @ApiOAuth2, etc.
 */
export interface SecuritySchemeMetadata {
  name: string;
  apiKeyName: string | undefined;
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme: string | undefined;
  bearerFormat: string | undefined;
  in: 'query' | 'header' | 'cookie' | undefined;
  flows: OAuthFlowsObject | undefined;
  openIdConnectUrl: string | undefined;
  description: string | undefined;
}

/**
 * Security requirement metadata for @ApiSecurity decorator
 */
export interface ApiSecurityMetadata {
  target: Function;
  methodName?: string; // undefined for controller-level
  schemes: string[];
}

/**
 * Metadata for file upload decorators (@ApiFile, @ApiFiles)
 */
export interface ApiFileMetadata {
  target: Function;
  methodName: string;
  name: string;
  isArray: boolean;
  required: boolean;
  description: string | undefined;
  maxSize: number | undefined;
  allowedMimeTypes: string[] | undefined;
}

/**
 * Metadata for content type override (@ApiConsumes)
 */
export interface ApiConsumesMetadata {
  target: Function;
  methodName: string;
  contentTypes: string[];
}

/**
 * Middleware function type
 */
export type MiddlewareFunction = (req: any, res: any, next: any) => void | Promise<void>;

/**
 * Middleware reference - can be a function or a string key
 */
export type MiddlewareReference = MiddlewareFunction | string;

/**
 * Metadata for middleware decorator (@Use, @Middleware)
 */
export interface MiddlewareMetadata {
  target: Function;
  methodName?: string; // undefined for controller-level middleware
  middlewares: MiddlewareReference[];
}

/**
 * Complete metadata storage structure
 */
export interface MetadataStorage {
  controllers: ControllerMetadata[];
  methods: MethodMetadata[];
  operations: ApiOperationMetadata[];
  responses: ApiResponseMetadata[];
  bodyParams: ApiBodyMetadata[];
  queryParams: ApiQueryMetadata[];
  pathParams: ApiParamMetadata[];
  properties: ApiPropertyMetadata[];
  tags: ApiTagsMetadata[];
  securitySchemes: SecuritySchemeMetadata[];
  securityRequirements: ApiSecurityMetadata[];
  fileParams: ApiFileMetadata[];
  consumes: ApiConsumesMetadata[];
  middlewares: MiddlewareMetadata[];
}
