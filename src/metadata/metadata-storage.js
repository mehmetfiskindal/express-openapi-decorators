"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataKeys = exports.metadataStorage = void 0;
require("reflect-metadata");
/**
 * Global metadata storage singleton
 * All decorators store their metadata here for later processing
 */
class MetadataStorageImpl {
    constructor() {
        this.controllers = [];
        this.methods = [];
        this.operations = [];
        this.responses = [];
        this.bodyParams = [];
        this.queryParams = [];
        this.pathParams = [];
        this.properties = [];
        this.tags = [];
    }
    /**
     * Add controller metadata
     */
    addController(metadata) {
        this.controllers.push(metadata);
    }
    /**
     * Add method metadata
     */
    addMethod(metadata) {
        this.methods.push(metadata);
    }
    /**
     * Add operation metadata
     */
    addOperation(metadata) {
        this.operations.push(metadata);
    }
    /**
     * Add response metadata
     */
    addResponse(metadata) {
        this.responses.push(metadata);
    }
    /**
     * Add body parameter metadata
     */
    addBodyParam(metadata) {
        this.bodyParams.push(metadata);
    }
    /**
     * Add query parameter metadata
     */
    addQueryParam(metadata) {
        this.queryParams.push(metadata);
    }
    /**
     * Add path parameter metadata
     */
    addPathParam(metadata) {
        this.pathParams.push(metadata);
    }
    /**
     * Add property metadata for DTOs
     */
    addProperty(metadata) {
        this.properties.push(metadata);
    }
    /**
     * Add tags metadata
     */
    addTags(metadata) {
        this.tags.push(metadata);
    }
    /**
     * Get all methods for a specific controller
     */
    getMethodsForController(controller) {
        return this.methods.filter((m) => m.controllerTarget === controller);
    }
    /**
     * Get operation metadata for a specific method
     */
    getOperationForMethod(target, methodName) {
        return this.operations.find((o) => o.target === target && o.methodName === methodName);
    }
    /**
     * Get all responses for a specific method
     */
    getResponsesForMethod(target, methodName) {
        return this.responses.filter((r) => r.target === target && r.methodName === methodName);
    }
    /**
     * Get body parameter for a specific method
     */
    getBodyParamForMethod(target, methodName) {
        return this.bodyParams.find((b) => b.target === target && b.methodName === methodName);
    }
    /**
     * Get all query parameters for a specific method
     */
    getQueryParamsForMethod(target, methodName) {
        return this.queryParams.filter((q) => q.target === target && q.methodName === methodName);
    }
    /**
     * Get all path parameters for a specific method
     */
    getPathParamsForMethod(target, methodName) {
        return this.pathParams.filter((p) => p.target === target && p.methodName === methodName);
    }
    /**
     * Get all properties for a specific DTO class
     */
    getPropertiesForTarget(target) {
        return this.properties.filter((p) => p.target === target);
    }
    /**
     * Get tags for a specific controller
     */
    getTagsForController(controller) {
        const tagsMetadata = this.tags.find((t) => t.target === controller);
        return tagsMetadata?.tags ?? [];
    }
    /**
     * Find controller by target class
     */
    findController(target) {
        return this.controllers.find((c) => c.target === target);
    }
    /**
     * Clear all metadata (useful for testing)
     */
    clear() {
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
exports.metadataStorage = new MetadataStorageImpl();
/**
 * Metadata keys for reflect-metadata
 */
exports.MetadataKeys = {
    DESIGN_TYPE: 'design:type',
    DESIGN_PARAM_TYPES: 'design:paramtypes',
    DESIGN_RETURN_TYPE: 'design:returntype',
};
