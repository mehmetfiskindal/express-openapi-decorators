// Metadata
export { metadataStorage } from './metadata/metadata-storage.js';
export type {
  HttpMethod,
  OpenApiSchemaType,
  ControllerMetadata,
  MethodMetadata,
  ApiOperationMetadata,
  ApiResponseMetadata,
  ApiBodyMetadata,
  ApiQueryMetadata,
  ApiParamMetadata,
  ApiPropertyMetadata,
  ApiTagsMetadata,
  SecuritySchemeMetadata,
  ApiSecurityMetadata,
  ApiFileMetadata,
  ApiConsumesMetadata,
  MiddlewareMetadata,
  MiddlewareFunction,
  OAuthFlowObject,
  OAuthFlowsObject,
} from './metadata/metadata-types.js';

// Decorators - Core
export { Controller } from './decorators/controller.decorator.js';
export type { ControllerOptions } from './decorators/controller.decorator.js';
export { Get, Post, Put, Patch, Delete } from './decorators/method.decorator.js';
export { ApiTags } from './decorators/api-tags.decorator.js';
export { ApiOperation } from './decorators/api-operation.decorator.js';
export type { ApiOperationOptions } from './decorators/api-operation.decorator.js';
export { ApiResponse } from './decorators/api-response.decorator.js';
export type { ApiResponseOptions } from './decorators/api-response.decorator.js';
export { ApiBody } from './decorators/api-body.decorator.js';
export type { ApiBodyOptions } from './decorators/api-body.decorator.js';
export { ApiQuery } from './decorators/api-query.decorator.js';
export type { ApiQueryOptions } from './decorators/api-query.decorator.js';
export { ApiParam } from './decorators/api-param.decorator.js';
export type { ApiParamOptions } from './decorators/api-param.decorator.js';
export { ApiProperty, ApiPropertyOptional } from './decorators/api-property.decorator.js';
export type { ApiPropertyOptions } from './decorators/api-property.decorator.js';

// Decorators - Security
export {
  ApiBearerAuth,
  ApiBasicAuth,
  ApiApiKey,
  ApiOAuth2,
  ApiOpenIdConnect,
  ApiSecurity,
  Public,
} from './decorators/api-security.decorator.js';
export type {
  ApiKeyOptions,
  OAuth2Options,
  OpenIdConnectOptions,
} from './decorators/api-security.decorator.js';

// Decorators - File Upload
export {
  ApiFile,
  ApiFiles,
  ApiConsumes,
  ApiFormData,
} from './decorators/api-file.decorator.js';
export type {
  ApiFileOptions,
  ApiFilesOptions,
} from './decorators/api-file.decorator.js';

// Decorators - Middleware
export { Use } from './decorators/middleware.decorator.js';

// Generator
export { createOpenApiDocument } from './generator/create-openapi-document.js';
export type {
  CreateOpenApiDocumentOptions,
  OpenApiServer,
} from './generator/create-openapi-document.js';

// Routing
export { ExpressAdapter, createExpressAdapter } from './routing/express-adapter.js';
export type {
  ExpressAdapterOptions,
  ControllerFactory,
} from './routing/express-adapter.js';

// Types
export type {
  OpenAPIV3,
  OpenAPIV3_1,
  OpenApiVersion,
  OpenAPIObject,
  SecuritySchemeObject,
  InfoObject,
  ServerObject,
  PathsObject,
  PathItemObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  ResponsesObject,
  ResponseObject,
  SchemaObject,
  ComponentsObject,
  SecurityRequirementObject,
  TagObject,
  ExternalDocumentationObject,
} from './types/openapi.types.js';
export type { OpenApiDocument } from './types/openapi-3.1.types.js';

// Validation (optional - only if class-validator is installed)
export {
  extractValidationConstraints,
  extractValidationConstraintsV31,
  isPropertyOptional,
  isPropertyArray,
  mergeValidationConstraints,
  isClassValidatorAvailable,
} from './validation/class-validator-adapter.js';

