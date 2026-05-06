/**
 * OpenAPI 3.1.0 type definitions
 * Based on OpenAPI Specification 3.1.0
 */

export namespace OpenAPIV3_1 {
  export type Document = {
    openapi: '3.1.0';
    info: InfoObject;
    jsonSchemaDialect?: string;
    servers?: ServerObject[];
    paths?: PathsObject;
    webhooks?: Record<string, PathItemObject | ReferenceObject>;
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
    externalDocs?: ExternalDocumentationObject;
  };

  export interface InfoObject {
    title: string;
    summary?: string;
    description?: string;
    termsOfService?: string;
    contact?: ContactObject;
    license?: LicenseObject;
    version: string;
  }

  export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
  }

  export interface LicenseObject {
    name: string;
    identifier?: string;
    url?: string;
  }

  export interface ServerObject {
    url: string;
    description?: string;
    variables?: Record<string, ServerVariableObject>;
  }

  export interface ServerVariableObject {
    enum?: string[];
    default: string;
    description?: string;
  }

  export interface PathsObject {
    [pattern: string]: PathItemObject | undefined;
  }

  export interface PathItemObject {
    $ref?: string;
    summary?: string;
    description?: string;
    get?: OperationObject;
    put?: OperationObject;
    post?: OperationObject;
    delete?: OperationObject;
    options?: OperationObject;
    head?: OperationObject;
    patch?: OperationObject;
    trace?: OperationObject;
    servers?: ServerObject[];
    parameters?: (ParameterObject | ReferenceObject)[];
  }

  export interface OperationObject {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: (ParameterObject | ReferenceObject)[];
    requestBody?: RequestBodyObject | ReferenceObject;
    responses?: ResponsesObject;
    callbacks?: Record<string, CallbackObject | ReferenceObject>;
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
  }

  export interface ExternalDocumentationObject {
    description?: string;
    url: string;
  }

  export interface ParameterObject {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject | ReferenceObject;
    example?: unknown;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    content?: Record<string, MediaTypeObject>;
  }

  export interface SchemaObject {
    // JSON Schema Core
    $id?: string;
    $schema?: string;
    $ref?: string;
    $anchor?: string;
    $dynamicRef?: string;
    $dynamicAnchor?: string;
    $vocabulary?: Record<string, boolean>;
    $comment?: string;
    $defs?: Record<string, SchemaObject>;

    // JSON Schema Validation
    type?: 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string' | ('array' | 'boolean' | 'integer' | 'number' | 'object' | 'string' | 'null')[];
    const?: unknown;
    enum?: unknown[];
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxContains?: number;
    minContains?: number;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    dependentRequired?: Record<string, string[]>;

    // JSON Schema Applicator
    prefixItems?: (SchemaObject | ReferenceObject)[];
    items?: SchemaObject | ReferenceObject;
    contains?: SchemaObject | ReferenceObject;
    properties?: Record<string, SchemaObject | ReferenceObject>;
    patternProperties?: Record<string, SchemaObject | ReferenceObject>;
    additionalProperties?: boolean | SchemaObject | ReferenceObject;
    propertyNames?: SchemaObject | ReferenceObject;
    allOf?: (SchemaObject | ReferenceObject)[];
    anyOf?: (SchemaObject | ReferenceObject)[];
    oneOf?: (SchemaObject | ReferenceObject)[];
    not?: SchemaObject | ReferenceObject;
    if?: SchemaObject | ReferenceObject;
    then?: SchemaObject | ReferenceObject;
    else?: SchemaObject | ReferenceObject;
    dependentSchemas?: Record<string, SchemaObject | ReferenceObject>;

    // JSON Schema Metadata
    title?: string;
    description?: string;
    default?: unknown;
    deprecated?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    examples?: unknown[];
    format?: string;

    // OpenAPI 3.1.0 specific
    discriminator?: DiscriminatorObject;
    xml?: XMLObject;
    externalDocs?: ExternalDocumentationObject;
  }

  export interface ReferenceObject {
    $ref: string;
    summary?: string;
    description?: string;
  }

  export interface DiscriminatorObject {
    propertyName: string;
    mapping?: Record<string, string>;
  }

  export interface XMLObject {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
  }

  export interface ResponseObject {
    description: string;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    content?: Record<string, MediaTypeObject>;
    links?: Record<string, LinkObject | ReferenceObject>;
  }

  export interface ResponsesObject {
    [code: string]: ResponseObject | ReferenceObject | undefined;
  }

  export interface MediaTypeObject {
    schema?: SchemaObject | ReferenceObject;
    example?: unknown;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    encoding?: Record<string, EncodingObject>;
  }

  export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: unknown;
    externalValue?: string;
  }

  export interface EncodingObject {
    contentType?: string;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
  }

  export interface RequestBodyObject {
    description?: string;
    content: Record<string, MediaTypeObject>;
    required?: boolean;
  }

  export interface HeaderObject {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject | ReferenceObject;
    example?: unknown;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    content?: Record<string, MediaTypeObject>;
  }

  export interface CallbackObject {
    [expression: string]: PathItemObject;
  }

  export interface SecurityRequirementObject {
    [name: string]: string[];
  }

  export interface ComponentsObject {
    schemas?: Record<string, SchemaObject | ReferenceObject>;
    responses?: Record<string, ResponseObject | ReferenceObject>;
    parameters?: Record<string, ParameterObject | ReferenceObject>;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
    links?: Record<string, LinkObject | ReferenceObject>;
    callbacks?: Record<string, CallbackObject | ReferenceObject>;
    pathItems?: Record<string, PathItemObject | ReferenceObject>;
  }

  export type SecuritySchemeObject =
    | HttpSecurityScheme
    | ApiKeySecurityScheme
    | OAuth2SecurityScheme
    | OpenIdSecurityScheme;

  export interface HttpSecurityScheme {
    type: 'http';
    description?: string;
    scheme: string;
    bearerFormat?: string;
  }

  export interface ApiKeySecurityScheme {
    type: 'apiKey';
    description?: string;
    name: string;
    in: 'query' | 'header' | 'cookie';
  }

  export interface OAuth2SecurityScheme {
    type: 'oauth2';
    description?: string;
    flows: OAuthFlowsObject;
  }

  export interface OpenIdSecurityScheme {
    type: 'openIdConnect';
    description?: string;
    openIdConnectUrl: string;
  }

  export interface OAuthFlowsObject {
    implicit?: OAuthFlowObject;
    password?: OAuthFlowObject;
    clientCredentials?: OAuthFlowObject;
    authorizationCode?: OAuthFlowObject;
  }

  export interface OAuthFlowObject {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
  }

  export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: Record<string, unknown>;
    requestBody?: unknown;
    description?: string;
    server?: ServerObject;
  }

  export interface TagObject {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
  }
}

// Union type for both OpenAPI versions
export type OpenApiVersion = '3.0.3' | '3.1.0';

// Document union type
export type OpenApiDocument = OpenAPIV3_1.Document;
