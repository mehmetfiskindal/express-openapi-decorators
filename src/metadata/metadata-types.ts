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
}
