import type { OpenAPIV3, OpenAPIV3_1 } from '../types/openapi.types.js';
import { metadataStorage } from '../metadata/metadata-storage.js';
import type { MethodMetadata, HttpMethod } from '../metadata/metadata-types.js';


// Type aliases for both versions
type ParameterObjectV31 = OpenAPIV3_1.ParameterObject;
type RequestBodyObjectV31 = OpenAPIV3_1.RequestBodyObject;
type ResponseObjectV31 = OpenAPIV3_1.ResponseObject;
type OperationObjectV31 = OpenAPIV3_1.OperationObject;
type PathsObjectV31 = OpenAPIV3_1.PathsObject;

/**
 * Map HTTP method to OpenAPI path item object key
 */
const httpMethodToPathKey: Record<HttpMethod, keyof OpenAPIV3.PathItemObject> = {
  get: 'get',
  post: 'post',
  put: 'put',
  patch: 'patch',
  delete: 'delete',
};

/**
 * Build the full path from controller base path and method path
 */
function buildFullPath(basePath: string, methodPath: string): string {
  // Normalize base path
  let fullPath = basePath;
  
  // Ensure no double slashes
  if (methodPath === '/') {
    return fullPath || '/';
  }
  
  if (!methodPath.startsWith('/')) {
    methodPath = '/' + methodPath;
  }
  
  fullPath = basePath + methodPath;
  
  // Convert Express-style parameters (:id) to OpenAPI style ({id})
  fullPath = convertExpressParamsToOpenApi(fullPath);
  
  return fullPath;
}

/**
 * Convert Express-style path parameters (:param) to OpenAPI style ({param})
 */
function convertExpressParamsToOpenApi(path: string): string {
  // Replace :paramName with {paramName}
  return path.replace(/:([^/]+)/g, '{$1}');
}

/**
 * Get primitive type for OpenAPI parameter schema
 */
function getPrimitiveTypeName(type: Function): 'string' | 'number' | 'boolean' {
  if (type === String) return 'string';
  if (type === Number) return 'number';
  if (type === Boolean) return 'boolean';
  return 'string';
}

/**
 * Generate query parameters for a method
 */
function generateQueryParameters(target: Function, methodName: string): OpenAPIV3.ParameterObject[] {
  const queryParams = metadataStorage.getQueryParamsForMethod(target, methodName);
  
  return queryParams.map((param): OpenAPIV3.ParameterObject => {
    const parameter: OpenAPIV3.ParameterObject = {
      name: param.name,
      in: 'query',
      required: param.required ?? false,
      schema: {
        type: getPrimitiveTypeName(param.type),
      },
    };

    if (param.description) {
      parameter.description = param.description;
    }

    if (param.example !== undefined) {
      parameter.example = param.example;
    }

    return parameter;
  });
}

/**
 * Generate path parameters for a method
 */
function generatePathParameters(target: Function, methodName: string): OpenAPIV3.ParameterObject[] {
  const pathParams = metadataStorage.getPathParamsForMethod(target, methodName);
  
  return pathParams.map((param): OpenAPIV3.ParameterObject => {
    const parameter: OpenAPIV3.ParameterObject = {
      name: param.name,
      in: 'path',
      required: true, // Path parameters are always required
      schema: {
        type: getPrimitiveTypeName(param.type),
      },
    };

    if (param.description) {
      parameter.description = param.description;
    }

    if (param.example !== undefined) {
      parameter.example = param.example;
    }

    return parameter;
  });
}

/**
 * Generate multipart/form-data schema for file uploads
 */
function generateFileUploadSchema(fileParams: import('../metadata/metadata-types.js').ApiFileMetadata[]): OpenAPIV3.SchemaObject {
  const properties: Record<string, OpenAPIV3.SchemaObject> = {};
  const required: string[] = [];

  for (const fileParam of fileParams) {
    const fileSchema: OpenAPIV3.SchemaObject = {
      type: 'string',
      format: 'binary',
    };

    if (fileParam.description) {
      fileSchema.description = fileParam.description;
    }

    if (fileParam.isArray) {
      properties[fileParam.name] = {
        type: 'array',
        items: fileSchema,
      };
    } else {
      properties[fileParam.name] = fileSchema;
    }

    if (fileParam.required) {
      required.push(fileParam.name);
    }
  }

  const schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties,
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

/**
 * Generate request body for a method
 */
function generateRequestBody(target: Function, methodName: string): OpenAPIV3.RequestBodyObject | undefined {
  const bodyParam = metadataStorage.getBodyParamForMethod(target, methodName);
  const fileParams = metadataStorage.getFileParamsForMethod(target, methodName);
  const consumes = metadataStorage.getConsumesForMethod(target, methodName);

  // Handle file uploads
  if (fileParams.length > 0 || consumes?.contentTypes.includes('multipart/form-data')) {
    const effectiveFileParams = fileParams.length > 0 
      ? fileParams 
      : [{ name: 'file', isArray: false, required: true } as import('../metadata/metadata-types.js').ApiFileMetadata];

    const requestBody: OpenAPIV3.RequestBodyObject = {
      content: {
        'multipart/form-data': {
          schema: generateFileUploadSchema(effectiveFileParams),
        },
      },
    };

    // Check if any file is required
    const hasRequiredFiles = effectiveFileParams.some(f => f.required);
    if (hasRequiredFiles) {
      requestBody.required = true;
    }

    return requestBody;
  }

  // Handle regular body parameter
  if (!bodyParam) {
    return undefined;
  }

  // Check for custom content types
  const contentType = consumes?.contentTypes[0] ?? 'application/json';

  const requestBody: OpenAPIV3.RequestBodyObject = {
    required: bodyParam.required ?? true,
    content: {
      [contentType]: {
        schema: {
          $ref: `#/components/schemas/${bodyParam.type.name}`,
        },
      },
    },
  };

  if (bodyParam.description) {
    requestBody.description = bodyParam.description;
  }

  return requestBody;
}

/**
 * Generate responses for a method
 */
function generateResponses(target: Function, methodName: string): OpenAPIV3.ResponsesObject {
  const responses: OpenAPIV3.ResponsesObject = {};
  const responseMetadataList = metadataStorage.getResponsesForMethod(target, methodName);

  for (const responseMeta of responseMetadataList) {
    const response: OpenAPIV3.ResponseObject = {
      description: responseMeta.description ?? getDefaultResponseDescription(responseMeta.status),
    };

    // Add content if type is specified
    if (responseMeta.type) {
      let schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;

      if (responseMeta.isArray) {
        schema = {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${responseMeta.type.name}`,
          },
        };
      } else {
        schema = {
          $ref: `#/components/schemas/${responseMeta.type.name}`,
        };
      }

      response.content = {
        'application/json': {
          schema,
        },
      };
    }

    responses[responseMeta.status.toString()] = response;
  }

  // Add default 200 response if no responses defined
  if (Object.keys(responses).length === 0) {
    responses['200'] = {
      description: 'Success',
    };
  }

  return responses;
}

/**
 * Get default response description based on status code
 */
function getDefaultResponseDescription(status: number): string {
  const descriptions: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
  };

  return descriptions[status] ?? 'Success';
}

/**
 * Generate security requirements for a method
 */
function generateSecurityRequirements(
  controller: Function,
  target: Function,
  methodName: string
): OpenAPIV3.SecurityRequirementObject[] | undefined {
  // Get controller-level security
  const controllerSecurity = metadataStorage.getSecurityForController(controller);
  
  // Get method-level security
  const methodSecurity = metadataStorage.getSecurityForMethod(target, methodName);
  
  // Method-level security takes precedence over controller-level
  // If method has security defined (including empty array for @Public()), use it
  // Otherwise, use controller-level security
  let effectiveSecurity: typeof methodSecurity;
  
  if (methodSecurity.length > 0) {
    effectiveSecurity = methodSecurity;
  } else if (controllerSecurity.length > 0) {
    effectiveSecurity = controllerSecurity;
  } else {
    return undefined;
  }
  
  // Convert to OpenAPI format
  const security: OpenAPIV3.SecurityRequirementObject[] = effectiveSecurity.map(req => {
    const requirement: OpenAPIV3.SecurityRequirementObject = {};
    for (const scheme of req.schemes) {
      requirement[scheme] = [];
    }
    return requirement;
  });
  
  return security.length > 0 ? security : undefined;
}

/**
 * Generate a single OpenAPI operation
 */
function generateOperation(
  controller: Function,
  method: MethodMetadata
): OpenAPIV3.OperationObject {
  const operation: Partial<OpenAPIV3.OperationObject> = {
    operationId: `${controller.name}_${method.methodName}`,
  };

  // Add tags from controller
  const tags = metadataStorage.getTagsForController(controller);
  if (tags.length > 0) {
    operation.tags = tags;
  }

  // Add operation metadata
  const operationMeta = metadataStorage.getOperationForMethod(
    method.controllerTarget,
    method.methodName
  );

  if (operationMeta) {
    operation.summary = operationMeta.summary;
    if (operationMeta.description) {
      operation.description = operationMeta.description;
    }
    if (operationMeta.operationId) {
      operation.operationId = operationMeta.operationId;
    }
    if (operationMeta.deprecated) {
      operation.deprecated = true;
    }
  }

  // Add parameters (query and path)
  const parameters: OpenAPIV3.ParameterObject[] = [
    ...generateQueryParameters(method.controllerTarget, method.methodName),
    ...generatePathParameters(method.controllerTarget, method.methodName),
  ];

  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  // Add request body (if applicable)
  const requestBody = generateRequestBody(
    method.controllerTarget,
    method.methodName
  );
  if (requestBody) {
    operation.requestBody = requestBody;
  }

  // Add responses
  operation.responses = generateResponses(
    method.controllerTarget,
    method.methodName
  );

  // Add security requirements
  const security = generateSecurityRequirements(
    controller,
    method.controllerTarget,
    method.methodName
  );
  if (security) {
    operation.security = security;
  }

  return operation as OpenAPIV3.OperationObject;
}

/**
 * Generate OpenAPI paths from all controllers
 */
export function generatePaths(controllers: Function[]): OpenAPIV3.PathsObject {
  const paths: OpenAPIV3.PathsObject = {};

  for (const controller of controllers) {
    const controllerMeta = metadataStorage.findController(controller);
    if (!controllerMeta) {
      continue;
    }

    const methods = metadataStorage.getMethodsForController(controller);

    for (const method of methods) {
      const fullPath = buildFullPath(controllerMeta.basePath, method.path);
      const pathKey = httpMethodToPathKey[method.httpMethod];

      // Initialize path if not exists
      if (!paths[fullPath]) {
        paths[fullPath] = {};
      }

      // Add operation to path
      const operation = generateOperation(controller, method);
      (paths[fullPath] as Record<string, OpenAPIV3.OperationObject>)[pathKey] = operation;
    }
  }

  return paths;
}

/**
 * Generate query parameters for OpenAPI 3.1.0
 */
function generateQueryParametersV31(target: Function, methodName: string): ParameterObjectV31[] {
  const queryParams = metadataStorage.getQueryParamsForMethod(target, methodName);

  return queryParams.map((param): ParameterObjectV31 => {
    const parameter: ParameterObjectV31 = {
      name: param.name,
      in: 'query',
      required: param.required ?? false,
      schema: {
        type: getPrimitiveTypeName(param.type),
      },
    };

    if (param.description) {
      parameter.description = param.description;
    }

    if (param.example !== undefined) {
      parameter.example = param.example;
    }

    return parameter;
  });
}

/**
 * Generate path parameters for OpenAPI 3.1.0
 */
function generatePathParametersV31(target: Function, methodName: string): ParameterObjectV31[] {
  const pathParams = metadataStorage.getPathParamsForMethod(target, methodName);

  return pathParams.map((param): ParameterObjectV31 => {
    const parameter: ParameterObjectV31 = {
      name: param.name,
      in: 'path',
      required: true, // Path parameters are always required
      schema: {
        type: getPrimitiveTypeName(param.type),
      },
    };

    if (param.description) {
      parameter.description = param.description;
    }

    if (param.example !== undefined) {
      parameter.example = param.example;
    }

    return parameter;
  });
}

/**
 * Generate multipart/form-data schema for OpenAPI 3.1.0 file uploads
 */
function generateFileUploadSchemaV31(fileParams: import('../metadata/metadata-types.js').ApiFileMetadata[]): OpenAPIV3_1.SchemaObject {
  const properties: Record<string, OpenAPIV3_1.SchemaObject> = {};
  const required: string[] = [];

  for (const fileParam of fileParams) {
    const fileSchema = {
      type: 'string',
      contentEncoding: 'base64',
      contentMediaType: fileParam.allowedMimeTypes?.[0] ?? 'application/octet-stream',
    } as OpenAPIV3_1.SchemaObject;

    if (fileParam.description) {
      fileSchema.description = fileParam.description;
    }

    if (fileParam.isArray) {
      properties[fileParam.name] = {
        type: 'array',
        items: fileSchema,
      };
    } else {
      properties[fileParam.name] = fileSchema;
    }

    if (fileParam.required) {
      required.push(fileParam.name);
    }
  }

  const schema: OpenAPIV3_1.SchemaObject = {
    type: 'object',
    properties,
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

/**
 * Generate request body for OpenAPI 3.1.0
 */
function generateRequestBodyV31(target: Function, methodName: string): RequestBodyObjectV31 | undefined {
  const bodyParam = metadataStorage.getBodyParamForMethod(target, methodName);
  const fileParams = metadataStorage.getFileParamsForMethod(target, methodName);
  const consumes = metadataStorage.getConsumesForMethod(target, methodName);

  // Handle file uploads
  if (fileParams.length > 0 || consumes?.contentTypes.includes('multipart/form-data')) {
    const effectiveFileParams = fileParams.length > 0
      ? fileParams
      : [{ name: 'file', isArray: false, required: true } as import('../metadata/metadata-types.js').ApiFileMetadata];

    const requestBody: RequestBodyObjectV31 = {
      content: {
        'multipart/form-data': {
          schema: generateFileUploadSchemaV31(effectiveFileParams),
        },
      },
    };

    // Check if any file is required
    const hasRequiredFiles = effectiveFileParams.some(f => f.required);
    if (hasRequiredFiles) {
      requestBody.required = true;
    }

    return requestBody;
  }

  // Handle regular body parameter
  if (!bodyParam) {
    return undefined;
  }

  // Check for custom content types
  const contentType = consumes?.contentTypes[0] ?? 'application/json';

  const requestBody: RequestBodyObjectV31 = {
    required: bodyParam.required ?? true,
    content: {
      [contentType]: {
        schema: {
          $ref: `#/components/schemas/${bodyParam.type.name}`,
        },
      },
    },
  };

  if (bodyParam.description) {
    requestBody.description = bodyParam.description;
  }

  return requestBody;
}

/**
 * Generate responses for OpenAPI 3.1.0
 */
function generateResponsesV31(target: Function, methodName: string): OpenAPIV3_1.ResponsesObject {
  const responses: OpenAPIV3_1.ResponsesObject = {};
  const responseMetadataList = metadataStorage.getResponsesForMethod(target, methodName);

  for (const responseMeta of responseMetadataList) {
    const response: ResponseObjectV31 = {
      description: responseMeta.description ?? getDefaultResponseDescription(responseMeta.status),
    };

    // Add content if type is specified
    if (responseMeta.type) {
      let schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject;

      if (responseMeta.isArray) {
        schema = {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${responseMeta.type.name}`,
          },
        };
      } else {
        schema = {
          $ref: `#/components/schemas/${responseMeta.type.name}`,
        };
      }

      response.content = {
        'application/json': {
          schema,
        },
      };
    }

    responses[responseMeta.status.toString()] = response;
  }

  // Add default 200 response if no responses defined
  if (Object.keys(responses).length === 0) {
    responses['200'] = {
      description: 'Success',
    };
  }

  return responses;
}

/**
 * Generate security requirements for OpenAPI 3.1.0
 */
function generateSecurityRequirementsV31(
  controller: Function,
  target: Function,
  methodName: string
): OpenAPIV3_1.SecurityRequirementObject[] | undefined {
  // Get controller-level security
  const controllerSecurity = metadataStorage.getSecurityForController(controller);

  // Get method-level security
  const methodSecurity = metadataStorage.getSecurityForMethod(target, methodName);

  // Method-level security takes precedence over controller-level
  // If method has security defined (including empty array for @Public()), use it
  // Otherwise, use controller-level security
  let effectiveSecurity: typeof methodSecurity;

  if (methodSecurity.length > 0) {
    effectiveSecurity = methodSecurity;
  } else if (controllerSecurity.length > 0) {
    effectiveSecurity = controllerSecurity;
  } else {
    return undefined;
  }

  // Convert to OpenAPI format
  const security: OpenAPIV3_1.SecurityRequirementObject[] = effectiveSecurity.map(req => {
    const requirement: OpenAPIV3_1.SecurityRequirementObject = {};
    for (const scheme of req.schemes) {
      requirement[scheme] = [];
    }
    return requirement;
  });

  return security.length > 0 ? security : undefined;
}

/**
 * Generate a single OpenAPI 3.1.0 operation
 */
function generateOperationV31(
  controller: Function,
  method: MethodMetadata
): OperationObjectV31 {
  const operation: Partial<OperationObjectV31> = {
    operationId: `${controller.name}_${method.methodName}`,
  };

  // Add tags from controller
  const tags = metadataStorage.getTagsForController(controller);
  if (tags.length > 0) {
    operation.tags = tags;
  }

  // Add operation metadata
  const operationMeta = metadataStorage.getOperationForMethod(
    method.controllerTarget,
    method.methodName
  );

  if (operationMeta) {
    operation.summary = operationMeta.summary;
    if (operationMeta.description) {
      operation.description = operationMeta.description;
    }
    if (operationMeta.operationId) {
      operation.operationId = operationMeta.operationId;
    }
    if (operationMeta.deprecated) {
      operation.deprecated = true;
    }
  }

  // Add parameters (query and path)
  const parameters: ParameterObjectV31[] = [
    ...generateQueryParametersV31(method.controllerTarget, method.methodName),
    ...generatePathParametersV31(method.controllerTarget, method.methodName),
  ];

  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  // Add request body (if applicable)
  const requestBody = generateRequestBodyV31(
    method.controllerTarget,
    method.methodName
  );
  if (requestBody) {
    operation.requestBody = requestBody;
  }

  // Add responses
  operation.responses = generateResponsesV31(
    method.controllerTarget,
    method.methodName
  );

  // Add security requirements
  const security = generateSecurityRequirementsV31(
    controller,
    method.controllerTarget,
    method.methodName
  );
  if (security) {
    operation.security = security;
  }

  return operation as OperationObjectV31;
}

/**
 * Generate OpenAPI 3.1.0 paths from all controllers
 */
export function generatePathsV31(controllers: Function[]): PathsObjectV31 {
  const paths: PathsObjectV31 = {};

  for (const controller of controllers) {
    const controllerMeta = metadataStorage.findController(controller);
    if (!controllerMeta) {
      continue;
    }

    const methods = metadataStorage.getMethodsForController(controller);

    for (const method of methods) {
      const fullPath = buildFullPath(controllerMeta.basePath, method.path);
      const pathKey = httpMethodToPathKey[method.httpMethod];

      // Initialize path if not exists
      if (!paths[fullPath]) {
        paths[fullPath] = {};
      }

      // Add operation to path
      const operation = generateOperationV31(controller, method);
      (paths[fullPath] as Record<string, OperationObjectV31>)[pathKey] = operation;
    }
  }

  return paths;
}
