/**
 * Class-validator adapter for OpenAPI schema generation
 * Automatically extracts validation metadata from class-validator decorators
 * and applies them to OpenAPI schema constraints
 */

import 'reflect-metadata';
import type { OpenAPIV3, OpenAPIV3_1 } from '../types/openapi.types.js';

// class-validator metadata keys (used for reflection)
const VALIDATION_METADATA_KEY = 'validationMetadata';

/**
 * Validation constraint from class-validator
 */
interface ValidationMetadata {
  type: string;
  target: Function;
  propertyName: string;
  constraints: unknown[];
  validationOptions?: {
    each?: boolean;
  };
}

/**
 * Get validation metadata from a class property
 * This uses reflection to read class-validator metadata
 */
function getValidationMetadata(target: Function, propertyKey: string): ValidationMetadata[] {
  // Try to get metadata from reflect-metadata
  const metadata = Reflect.getMetadata(VALIDATION_METADATA_KEY, target.prototype, propertyKey);
  
  if (Array.isArray(metadata)) {
    return metadata;
  }

  // Fallback: try to get from class-validator's storage
  // This requires class-validator to be imported
  try {
    const classValidator = require('class-validator');
    if (classValidator.getMetadataStorage) {
      const storage = classValidator.getMetadataStorage();
      if (storage) {
        const targetMetadatas = storage.getTargetValidationMetadatas?.(target, target.name, false, false) || [];
        return targetMetadatas.filter((m: ValidationMetadata) => m.propertyName === propertyKey);
      }
    }
  } catch {
    // class-validator not installed, return empty
  }

  return [];
}

/**
 * Extract OpenAPI constraints from class-validator metadata
 */
export function extractValidationConstraints(
  target: Function,
  propertyKey: string
): Partial<OpenAPIV3.SchemaObject> {
  const constraints: Partial<OpenAPIV3.SchemaObject> = {};
  const validations = getValidationMetadata(target, propertyKey);

  for (const validation of validations) {
    switch (validation.type) {
      // String constraints
      case 'minLength':
        constraints.minLength = validation.constraints[0] as number;
        break;
      case 'maxLength':
        constraints.maxLength = validation.constraints[0] as number;
        break;
      case 'isEmail':
        constraints.format = 'email';
        break;
      case 'isUrl':
        constraints.format = 'uri';
        break;
      case 'isUUID':
        constraints.format = 'uuid';
        break;
      case 'matches':
        if (validation.constraints[0] instanceof RegExp) {
          constraints.pattern = validation.constraints[0].source;
        }
        break;

      // Number constraints
      case 'min':
        constraints.minimum = validation.constraints[0] as number;
        break;
      case 'max':
        constraints.maximum = validation.constraints[0] as number;
        break;
      case 'isPositive':
        constraints.minimum = 0;
        constraints.exclusiveMinimum = true;
        break;
      case 'isNegative':
        constraints.maximum = 0;
        constraints.exclusiveMaximum = true;
        break;
      case 'isInt':
        constraints.type = 'integer';
        break;
      case 'multipleOf':
        constraints.multipleOf = validation.constraints[0] as number;
        break;

      // Array constraints
      case 'arrayMinSize':
        constraints.minItems = validation.constraints[0] as number;
        break;
      case 'arrayMaxSize':
        constraints.maxItems = validation.constraints[0] as number;
        break;
      case 'arrayUnique':
        constraints.uniqueItems = true;
        break;

      // Enum constraint
      case 'isEnum':
        if (validation.constraints[0]) {
          const enumObj = validation.constraints[0];
          if (typeof enumObj === 'object') {
            constraints.enum = Object.values(enumObj);
          }
        }
        break;

      // Date format
      case 'isDate':
      case 'isDateString':
        constraints.format = 'date-time';
        break;

      // ISO 8601 format
      case 'isISO8601':
        constraints.format = 'date-time';
        break;
    }
  }

  return constraints;
}

/**
 * Check if a property is optional (has @IsOptional decorator)
 */
export function isPropertyOptional(target: Function, propertyKey: string): boolean {
  const validations = getValidationMetadata(target, propertyKey);
  return validations.some(v => v.type === 'isOptional');
}

/**
 * Check if a property is an array (has @IsArray decorator or each: true option)
 */
export function isPropertyArray(target: Function, propertyKey: string): boolean {
  const validations = getValidationMetadata(target, propertyKey);
  return validations.some(v => 
    v.type === 'isArray' || v.validationOptions?.each === true
  );
}

/**
 * Merge class-validator constraints with existing schema
 */
export function mergeValidationConstraints(
  schema: OpenAPIV3.SchemaObject,
  target: Function,
  propertyKey: string
): OpenAPIV3.SchemaObject {
  const constraints = extractValidationConstraints(target, propertyKey);
  return { ...schema, ...constraints };
}

/**
 * Extract OpenAPI constraints from class-validator metadata (OpenAPI 3.1.0 version)
 */
export function extractValidationConstraintsV31(
  target: Function,
  propertyKey: string
): Partial<OpenAPIV3_1.SchemaObject> {
  const constraints: Partial<OpenAPIV3_1.SchemaObject> = {};
  const validations = getValidationMetadata(target, propertyKey);

  for (const validation of validations) {
    switch (validation.type) {
      // String constraints
      case 'minLength':
        constraints.minLength = validation.constraints[0] as number;
        break;
      case 'maxLength':
        constraints.maxLength = validation.constraints[0] as number;
        break;
      case 'isEmail':
        constraints.format = 'email';
        break;
      case 'isUrl':
        constraints.format = 'uri';
        break;
      case 'isUUID':
        constraints.format = 'uuid';
        break;
      case 'matches':
        if (validation.constraints[0] instanceof RegExp) {
          constraints.pattern = validation.constraints[0].source;
        }
        break;

      // Number constraints
      case 'min':
        constraints.minimum = validation.constraints[0] as number;
        break;
      case 'max':
        constraints.maximum = validation.constraints[0] as number;
        break;
      case 'isPositive':
        constraints.minimum = 0;
        constraints.exclusiveMinimum = 0;
        break;
      case 'isNegative':
        constraints.maximum = 0;
        constraints.exclusiveMaximum = 0;
        break;
      case 'isInt':
        constraints.type = 'integer';
        break;
      case 'multipleOf':
        constraints.multipleOf = validation.constraints[0] as number;
        break;

      // Array constraints
      case 'arrayMinSize':
        constraints.minItems = validation.constraints[0] as number;
        break;
      case 'arrayMaxSize':
        constraints.maxItems = validation.constraints[0] as number;
        break;
      case 'arrayUnique':
        constraints.uniqueItems = true;
        break;

      // Enum constraint
      case 'isEnum':
        if (validation.constraints[0]) {
          const enumObj = validation.constraints[0];
          if (typeof enumObj === 'object') {
            constraints.enum = Object.values(enumObj);
          }
        }
        break;

      // Date format
      case 'isDate':
      case 'isDateString':
        constraints.format = 'date-time';
        break;

      // ISO 8601 format
      case 'isISO8601':
        constraints.format = 'date-time';
        break;
    }
  }

  return constraints;
}

/**
 * Check if class-validator is available
 */
export function isClassValidatorAvailable(): boolean {
  try {
    require('class-validator');
    return true;
  } catch {
    return false;
  }
}
