"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchemaForDto = generateSchemaForDto;
exports.collectDtoClasses = collectDtoClasses;
exports.generateSchemas = generateSchemas;
exports.clearSchemaCache = clearSchemaCache;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
/**
 * Type to OpenAPI schema type mapping
 */
const typeToOpenApiType = new Map([
    [String, 'string'],
    [Number, 'number'],
    [Boolean, 'boolean'],
    [Object, 'object'],
    [Array, 'array'],
]);
/**
 * Type to OpenAPI format mapping (for primitive types)
 */
const typeToOpenApiFormat = new Map([
    [String, undefined],
    [Number, undefined],
    [Boolean, undefined],
]);
/**
 * Schema cache to avoid generating same schema multiple times
 */
const schemaCache = new Map();
/**
 * Convert a primitive type to OpenAPI schema
 */
function getPrimitiveSchema(type) {
    const schemaType = typeToOpenApiType.get(type) ?? 'string';
    const format = typeToOpenApiFormat.get(type);
    const schema = {
        type: schemaType,
    };
    if (format) {
        schema.format = format;
    }
    return schema;
}
/**
 * Convert property metadata to OpenAPI schema property
 */
function propertyMetadataToSchema(metadata) {
    const schema = {};
    // Handle array type
    if (metadata.isArray && metadata.type) {
        schema.type = 'array';
        // Check if array item type is a primitive or DTO
        if (isPrimitiveType(metadata.type)) {
            schema.items = getPrimitiveSchema(metadata.type);
        }
        else {
            // It's a DTO, generate reference
            schema.items = {
                $ref: `#/components/schemas/${metadata.type.name}`,
            };
        }
    }
    else if (metadata.type) {
        // Non-array type
        if (isPrimitiveType(metadata.type)) {
            const primitiveSchema = getPrimitiveSchema(metadata.type);
            Object.assign(schema, primitiveSchema);
        }
        else {
            // It's a DTO, generate reference
            return {
                $ref: `#/components/schemas/${metadata.type.name}`,
            };
        }
    }
    // Add enum if present
    if (metadata.enum && metadata.enum.length > 0) {
        schema.enum = metadata.enum;
    }
    // Add format if present
    if (metadata.format) {
        schema.format = metadata.format;
    }
    // Add example if present
    if (metadata.example !== undefined) {
        schema.example = metadata.example;
    }
    // Add default if present
    if (metadata.default !== undefined) {
        schema.default = metadata.default;
    }
    // Add description if present
    if (metadata.description) {
        schema.description = metadata.description;
    }
    return schema;
}
/**
 * Check if a type is a primitive type
 */
function isPrimitiveType(type) {
    return (type === String ||
        type === Number ||
        type === Boolean ||
        type === Object);
}
/**
 * Check if a type is a Date constructor
 */
function isDateType(type) {
    return type === Date;
}
/**
 * Generate OpenAPI schema for a DTO class
 */
function generateSchemaForDto(dtoClass) {
    // Check cache first
    if (schemaCache.has(dtoClass)) {
        return schemaCache.get(dtoClass);
    }
    // Get all properties for this DTO
    const properties = metadata_storage_js_1.metadataStorage.getPropertiesForTarget(dtoClass);
    const schema = {
        type: 'object',
        properties: {},
        required: [],
    };
    for (const property of properties) {
        // Add property to schema
        if (schema.properties) {
            schema.properties[property.propertyKey] = propertyMetadataToSchema(property);
        }
        // Add to required list if property is required
        if (property.required && schema.required) {
            schema.required.push(property.propertyKey);
        }
    }
    // Cache the schema
    schemaCache.set(dtoClass, schema);
    return schema;
}
/**
 * Collect all DTOs used in responses and body parameters
 */
function collectDtoClasses() {
    const dtoClasses = new Set();
    // Collect from responses
    for (const response of metadata_storage_js_1.metadataStorage.responses) {
        if (response.type) {
            dtoClasses.add(response.type);
        }
    }
    // Collect from body parameters
    for (const bodyParam of metadata_storage_js_1.metadataStorage.bodyParams) {
        dtoClasses.add(bodyParam.type);
    }
    // Collect from query parameters (for complex types, though unlikely)
    for (const queryParam of metadata_storage_js_1.metadataStorage.queryParams) {
        if (!isPrimitiveType(queryParam.type)) {
            dtoClasses.add(queryParam.type);
        }
    }
    // Collect from path parameters (for complex types, though unlikely)
    for (const pathParam of metadata_storage_js_1.metadataStorage.pathParams) {
        if (!isPrimitiveType(pathParam.type)) {
            dtoClasses.add(pathParam.type);
        }
    }
    // Recursively collect DTOs referenced in other DTOs
    const collectNestedDtos = (dtoClass) => {
        if (dtoClasses.has(dtoClass))
            return; // Already collected
        dtoClasses.add(dtoClass);
        const properties = metadata_storage_js_1.metadataStorage.getPropertiesForTarget(dtoClass);
        for (const prop of properties) {
            if (prop.type && !isPrimitiveType(prop.type)) {
                // Check if it's an array of DTOs
                if (prop.isArray && Array.isArray(prop.type)) {
                    collectNestedDtos(prop.type[0]);
                }
                else if (!Array.isArray(prop.type)) {
                    collectNestedDtos(prop.type);
                }
            }
        }
    };
    // Start collecting from all found DTOs
    const initialDtos = Array.from(dtoClasses);
    dtoClasses.clear();
    for (const dto of initialDtos) {
        collectNestedDtos(dto);
    }
    return dtoClasses;
}
/**
 * Generate all schemas for the OpenAPI document
 */
function generateSchemas() {
    const dtoClasses = collectDtoClasses();
    const schemas = {};
    for (const dtoClass of dtoClasses) {
        schemas[dtoClass.name] = generateSchemaForDto(dtoClass);
    }
    return schemas;
}
/**
 * Clear the schema cache (useful for testing)
 */
function clearSchemaCache() {
    schemaCache.clear();
}
