import 'reflect-metadata';
import type {
  ControllerMetadata,
  MethodMetadata,
  ApiOperationMetadata,
  ApiResponseMetadata,
  ApiBodyMetadata,
  ApiQueryMetadata,
  ApiParamMetadata,
  ApiPropertyMetadata,
  ApiTagsMetadata,
} from './metadata-types.js';

/**
 * Global metadata storage singleton
 * All decorators store their metadata here for later processing
 */
class MetadataStorageImpl {
  readonly controllers: ControllerMetadata[] = [];
  readonly methods: MethodMetadata[] = [];
  readonly operations: ApiOperationMetadata[] = [];
  readonly responses: ApiResponseMetadata[] = [];
  readonly bodyParams: ApiBodyMetadata[] = [];
  readonly queryParams: ApiQueryMetadata[] = [];
  readonly pathParams: ApiParamMetadata[] = [];
  readonly properties: ApiPropertyMetadata[] = [];
  readonly tags: ApiTagsMetadata[] = [];

  /**
   * Add controller metadata
   */
  addController(metadata: ControllerMetadata): void {
    this.controllers.push(metadata);
  }

  /**
   * Add method metadata
   */
  addMethod(metadata: MethodMetadata): void {
    this.methods.push(metadata);
  }

  /**
   * Add operation metadata
   */
  addOperation(metadata: ApiOperationMetadata): void {
    this.operations.push(metadata);
  }

  /**
   * Add response metadata
   */
  addResponse(metadata: ApiResponseMetadata): void {
    this.responses.push(metadata);
  }

  /**
   * Add body parameter metadata
   */
  addBodyParam(metadata: ApiBodyMetadata): void {
    this.bodyParams.push(metadata);
  }

  /**
   * Add query parameter metadata
   */
  addQueryParam(metadata: ApiQueryMetadata): void {
    this.queryParams.push(metadata);
  }

  /**
   * Add path parameter metadata
   */
  addPathParam(metadata: ApiParamMetadata): void {
    this.pathParams.push(metadata);
  }

  /**
   * Add property metadata for DTOs
   */
  addProperty(metadata: ApiPropertyMetadata): void {
    this.properties.push(metadata);
  }

  /**
   * Add tags metadata
   */
  addTags(metadata: ApiTagsMetadata): void {
    this.tags.push(metadata);
  }

  /**
   * Get all methods for a specific controller
   */
  getMethodsForController(controller: Function): MethodMetadata[] {
    return this.methods.filter((m) => m.controllerTarget === controller);
  }

  /**
   * Get operation metadata for a specific method
   */
  getOperationForMethod(target: Function, methodName: string): ApiOperationMetadata | undefined {
    return this.operations.find(
      (o) => o.target === target && o.methodName === methodName
    );
  }

  /**
   * Get all responses for a specific method
   */
  getResponsesForMethod(target: Function, methodName: string): ApiResponseMetadata[] {
    return this.responses.filter(
      (r) => r.target === target && r.methodName === methodName
    );
  }

  /**
   * Get body parameter for a specific method
   */
  getBodyParamForMethod(target: Function, methodName: string): ApiBodyMetadata | undefined {
    return this.bodyParams.find(
      (b) => b.target === target && b.methodName === methodName
    );
  }

  /**
   * Get all query parameters for a specific method
   */
  getQueryParamsForMethod(target: Function, methodName: string): ApiQueryMetadata[] {
    return this.queryParams.filter(
      (q) => q.target === target && q.methodName === methodName
    );
  }

  /**
   * Get all path parameters for a specific method
   */
  getPathParamsForMethod(target: Function, methodName: string): ApiParamMetadata[] {
    return this.pathParams.filter(
      (p) => p.target === target && p.methodName === methodName
    );
  }

  /**
   * Get all properties for a specific DTO class
   */
  getPropertiesForTarget(target: Function): ApiPropertyMetadata[] {
    return this.properties.filter((p) => p.target === target);
  }

  /**
   * Get tags for a specific controller
   */
  getTagsForController(controller: Function): string[] {
    const tagsMetadata = this.tags.find((t) => t.target === controller);
    return tagsMetadata?.tags ?? [];
  }

  /**
   * Find controller by target class
   */
  findController(target: Function): ControllerMetadata | undefined {
    return this.controllers.find((c) => c.target === target);
  }

  /**
   * Clear all metadata (useful for testing)
   */
  clear(): void {
    this.controllers.length = 0;
    this.methods.length = 0;
    this.operations.length = 0;
    this.responses.length = 0;
    this.bodyParams.length = 0;
    this.queryParams.length = 0;
    this.pathParams.length = 0;
    this.properties.length = 0;
    this.tags.length = 0;
  }
}

/**
 * Global metadata storage instance
 */
export const metadataStorage = new MetadataStorageImpl();

/**
 * Metadata keys for reflect-metadata
 */
export const MetadataKeys = {
  DESIGN_TYPE: 'design:type',
  DESIGN_PARAM_TYPES: 'design:paramtypes',
  DESIGN_RETURN_TYPE: 'design:returntype',
} as const;
