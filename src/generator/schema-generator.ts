import type { OpenAPIV3, OpenAPIV3_1 } from '../types/openapi.types.js';
import { metadataStorage } from '../metadata/metadata-storage.js';
import type { ApiPropertyMetadata } from '../metadata/metadata-types.js';
import {
  extractValidationConstraints,
  extractValidationConstraintsV31,
  isClassValidatorAvailable,
} from '../validation/class-validator-adapter.js';

// Type aliases for both versions
type SchemaObjectV30 = OpenAPIV3.SchemaObject;
type SchemaObjectV31 = OpenAPIV3_1.SchemaObject;

/**
 * Type to OpenAPI schema type mapping
 */
const typeToOpenApiType = new Map<Function, OpenAPIV3.SchemaObject['type']>([
  [String, 'string'],
  [Number, 'number'],
  [Boolean, 'boolean'],
  [Object, 'object'],
  [Array, 'array'],
]);

/**
 * Type to OpenAPI format mapping (for primitive types)
 */
const typeToOpenApiFormat = new Map<Function, string | undefined>([
  [String, undefined],
  [Number, undefined],
  [Boolean, undefined],
]);

/**
 * Schema cache to avoid generating same schema multiple times
 */
const schemaCache = new Map<Function, OpenAPIV3.SchemaObject>();

/**
 * Convert a primitive type to OpenAPI schema
 */
function getPrimitiveSchema(type: Function): OpenAPIV3.SchemaObject {
  const schemaType = typeToOpenApiType.get(type) ?? 'string';
  const format = typeToOpenApiFormat.get(type);

  const schema: OpenAPIV3.SchemaObject = {
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
function propertyMetadataToSchema(metadata: ApiPropertyMetadata): OpenAPIV3.SchemaObject {
  const schema: OpenAPIV3.SchemaObject = {};

  // Handle array type
  if (metadata.isArray && metadata.type) {
    schema.type = 'array';
    
    // Check if array item type is a primitive or DTO
    if (isPrimitiveType(metadata.type)) {
      schema.items = getPrimitiveSchema(metadata.type);
    } else {
      // It's a DTO, generate reference
      schema.items = {
        $ref: `#/components/schemas/${metadata.type.name}`,
      };
    }
  } else if (metadata.type) {
    // Non-array type
    if (isPrimitiveType(metadata.type)) {
      const primitiveSchema = getPrimitiveSchema(metadata.type);
      Object.assign(schema, primitiveSchema);
    } else {
      // It's a DTO, generate reference
      return {
        $ref: `#/components/schemas/${metadata.type.name}`,
      };
    }
  }

  // Add enum if present
  if (metadata.enum && metadata.enum.length > 0) {
    schema.enum = metadata.enum as unknown[];
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

  // Merge class-validator constraints if available
  if (isClassValidatorAvailable()) {
    const validationConstraints = extractValidationConstraints(
      metadata.target,
      metadata.propertyKey
    );
    Object.assign(schema, validationConstraints);
  }

  return schema;
}

/**
 * Check if a type is a primitive type
 */
function isPrimitiveType(type: Function): boolean {
  return (
    type === String ||
    type === Number ||
    type === Boolean ||
    type === Object
  );
}

/**
 * Check if a type is a Date constructor
 */
function isDateType(type: Function): boolean {
  return type === Date;
}

/**
 * Generate OpenAPI schema for a DTO class
 */
export function generateSchemaForDto(dtoClass: Function): OpenAPIV3.SchemaObject {
  // Check cache first
  if (schemaCache.has(dtoClass)) {
    return schemaCache.get(dtoClass)!;
  }

  // Get all properties for this DTO
  const properties = metadataStorage.getPropertiesForTarget(dtoClass);

  const schema: OpenAPIV3.SchemaObject = {
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
export function collectDtoClasses(): Set<Function> {
  const dtoClasses = new Set<Function>();

  // Collect from responses
  for (const response of metadataStorage.responses) {
    if (response.type) {
      dtoClasses.add(response.type);
    }
  }

  // Collect from body parameters
  for (const bodyParam of metadataStorage.bodyParams) {
    dtoClasses.add(bodyParam.type);
  }

  // Collect from query parameters (for complex types, though unlikely)
  for (const queryParam of metadataStorage.queryParams) {
    if (!isPrimitiveType(queryParam.type)) {
      dtoClasses.add(queryParam.type);
    }
  }

  // Collect from path parameters (for complex types, though unlikely)
  for (const pathParam of metadataStorage.pathParams) {
    if (!isPrimitiveType(pathParam.type)) {
      dtoClasses.add(pathParam.type);
    }
  }

  // Recursively collect DTOs referenced in other DTOs
  const collectNestedDtos = (dtoClass: Function): void => {
    if (dtoClasses.has(dtoClass)) return; // Already collected
    
    dtoClasses.add(dtoClass);
    
    const properties = metadataStorage.getPropertiesForTarget(dtoClass);
    for (const prop of properties) {
      if (prop.type && !isPrimitiveType(prop.type)) {
        // Check if it's an array of DTOs
        if (prop.isArray && Array.isArray(prop.type)) {
          collectNestedDtos(prop.type[0]);
        } else if (!Array.isArray(prop.type)) {
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
export function generateSchemas(): Record<string, OpenAPIV3.SchemaObject> {
  const dtoClasses = collectDtoClasses();
  const schemas: Record<string, OpenAPIV3.SchemaObject> = {};

  for (const dtoClass of dtoClasses) {
    schemas[dtoClass.name] = generateSchemaForDto(dtoClass);
  }

  return schemas;
}

/**
 * Generate schema property for OpenAPI 3.1.0
 * Main difference: uses type array for nullable instead of nullable: true
 */
function propertyMetadataToSchemaV31(metadata: ApiPropertyMetadata): SchemaObjectV31 {
  const schema: SchemaObjectV31 = {};

  // Handle array type
  if (metadata.isArray && metadata.type) {
    schema.type = 'array';

    // Check if array item type is a primitive or DTO
    if (isPrimitiveType(metadata.type)) {
      schema.items = getPrimitiveSchemaV31(metadata.type);
    } else {
      // It's a DTO, generate reference
      schema.items = {
        $ref: `#/components/schemas/${metadata.type.name}`,
      };
    }
  } else if (metadata.type) {
    // Non-array type
    if (isPrimitiveType(metadata.type)) {
      const primitiveSchema = getPrimitiveSchemaV31(metadata.type);
      Object.assign(schema, primitiveSchema);
    } else {
      // It's a DTO, generate reference
      return {
        $ref: `#/components/schemas/${metadata.type.name}`,
      };
    }
  }

  // Add enum if present
  if (metadata.enum && metadata.enum.length > 0) {
    schema.enum = metadata.enum as unknown[];
  }

  // Add format if present
  if (metadata.format) {
    schema.format = metadata.format;
  }

  // Add examples if present (3.1.0 uses examples array)
  if (metadata.example !== undefined) {
    schema.examples = [metadata.example];
  }

  // Add default if present
  if (metadata.default !== undefined) {
    schema.default = metadata.default;
  }

  // Add description if present
  if (metadata.description) {
    schema.description = metadata.description;
  }

  // Merge class-validator constraints if available
  if (isClassValidatorAvailable()) {
    const validationConstraints = extractValidationConstraintsV31(
      metadata.target,
      metadata.propertyKey
    );
    Object.assign(schema, validationConstraints);
  }

  return schema;
}

/**
 * Get primitive schema for OpenAPI 3.1.0
 */
function getPrimitiveSchemaV31(type: Function): SchemaObjectV31 {
  const schemaType = typeToOpenApiType.get(type) ?? 'string';

  const schema: SchemaObjectV31 = {
    type: schemaType,
  };

  return schema;
}

/**
 * Generate OpenAPI 3.1.0 schema for a DTO class
 */
export function generateSchemaForDtoV31(dtoClass: Function): SchemaObjectV31 {
  // Check cache first
  if (schemaCache.has(dtoClass)) {
    return schemaCache.get(dtoClass) as SchemaObjectV31;
  }

  // Get all properties for this DTO
  const properties = metadataStorage.getPropertiesForTarget(dtoClass);

  const schema: SchemaObjectV31 = {
    type: 'object',
    properties: {},
    required: [],
  };

  for (const property of properties) {
    // Add property to schema
    if (schema.properties) {
      schema.properties[property.propertyKey] = propertyMetadataToSchemaV31(property);
    }

    // Add to required list if property is required
    if (property.required && schema.required) {
      schema.required.push(property.propertyKey);
    }
  }

  // Cache the schema
  schemaCache.set(dtoClass, schema as SchemaObjectV30);

  return schema;
}

/**
 * Generate all schemas for OpenAPI 3.1.0 document
 */
export function generateSchemasV31(): Record<string, SchemaObjectV31> {
  const dtoClasses = collectDtoClasses();
  const schemas: Record<string, SchemaObjectV31> = {};

  for (const dtoClass of dtoClasses) {
    schemas[dtoClass.name] = generateSchemaForDtoV31(dtoClass);
  }

  return schemas;
}

/**
 * Clear the schema cache (useful for testing)
 */
export function clearSchemaCache(): void {
  schemaCache.clear();
}
