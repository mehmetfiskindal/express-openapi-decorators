"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePaths = generatePaths;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
/**
 * Map HTTP method to OpenAPI path item object key
 */
const httpMethodToPathKey = {
    get: 'get',
    post: 'post',
    put: 'put',
    patch: 'patch',
    delete: 'delete',
};
/**
 * Build the full path from controller base path and method path
 */
function buildFullPath(basePath, methodPath) {
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
function convertExpressParamsToOpenApi(path) {
    // Replace :paramName with {paramName}
    return path.replace(/:([^/]+)/g, '{$1}');
}
/**
 * Get primitive type for OpenAPI parameter schema
 */
function getPrimitiveTypeName(type) {
    if (type === String)
        return 'string';
    if (type === Number)
        return 'number';
    if (type === Boolean)
        return 'boolean';
    return 'string';
}
/**
 * Generate query parameters for a method
 */
function generateQueryParameters(target, methodName) {
    const queryParams = metadata_storage_js_1.metadataStorage.getQueryParamsForMethod(target, methodName);
    return queryParams.map((param) => {
        const parameter = {
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
function generatePathParameters(target, methodName) {
    const pathParams = metadata_storage_js_1.metadataStorage.getPathParamsForMethod(target, methodName);
    return pathParams.map((param) => {
        const parameter = {
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
 * Generate request body for a method
 */
function generateRequestBody(target, methodName) {
    const bodyParam = metadata_storage_js_1.metadataStorage.getBodyParamForMethod(target, methodName);
    if (!bodyParam) {
        return undefined;
    }
    const requestBody = {
        description: bodyParam.description,
        required: bodyParam.required ?? true,
        content: {
            'application/json': {
                schema: {
                    $ref: `#/components/schemas/${bodyParam.type.name}`,
                },
            },
        },
    };
    return requestBody;
}
/**
 * Generate responses for a method
 */
function generateResponses(target, methodName) {
    const responses = {};
    const responseMetadataList = metadata_storage_js_1.metadataStorage.getResponsesForMethod(target, methodName);
    for (const responseMeta of responseMetadataList) {
        const response = {
            description: responseMeta.description ?? getDefaultResponseDescription(responseMeta.status),
        };
        // Add content if type is specified
        if (responseMeta.type) {
            let schema;
            if (responseMeta.isArray) {
                schema = {
                    type: 'array',
                    items: {
                        $ref: `#/components/schemas/${responseMeta.type.name}`,
                    },
                };
            }
            else {
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
function getDefaultResponseDescription(status) {
    const descriptions = {
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
 * Generate a single OpenAPI operation
 */
function generateOperation(controller, method) {
    const operation = {
        operationId: `${controller.name}_${method.methodName}`,
    };
    // Add tags from controller
    const tags = metadata_storage_js_1.metadataStorage.getTagsForController(controller);
    if (tags.length > 0) {
        operation.tags = tags;
    }
    // Add operation metadata
    const operationMeta = metadata_storage_js_1.metadataStorage.getOperationForMethod(method.controllerTarget, method.methodName);
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
    const parameters = [
        ...generateQueryParameters(method.controllerTarget, method.methodName),
        ...generatePathParameters(method.controllerTarget, method.methodName),
    ];
    if (parameters.length > 0) {
        operation.parameters = parameters;
    }
    // Add request body (if applicable)
    const requestBody = generateRequestBody(method.controllerTarget, method.methodName);
    if (requestBody) {
        operation.requestBody = requestBody;
    }
    // Add responses
    operation.responses = generateResponses(method.controllerTarget, method.methodName);
    return operation;
}
/**
 * Generate OpenAPI paths from all controllers
 */
function generatePaths(controllers) {
    const paths = {};
    for (const controller of controllers) {
        const controllerMeta = metadata_storage_js_1.metadataStorage.findController(controller);
        if (!controllerMeta) {
            continue;
        }
        const methods = metadata_storage_js_1.metadataStorage.getMethodsForController(controller);
        for (const method of methods) {
            const fullPath = buildFullPath(controllerMeta.basePath, method.path);
            const pathKey = httpMethodToPathKey[method.httpMethod];
            // Initialize path if not exists
            if (!paths[fullPath]) {
                paths[fullPath] = {};
            }
            // Add operation to path
            const operation = generateOperation(controller, method);
            paths[fullPath][pathKey] = operation;
        }
    }
    return paths;
}
