"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = Controller;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
function Controller(pathOrOptions) {
    return (target) => {
        const path = typeof pathOrOptions === 'string'
            ? pathOrOptions
            : (pathOrOptions.path ?? '/');
        const metadata = {
            target: target,
            basePath: normalizePath(path),
        };
        metadata_storage_js_1.metadataStorage.addController(metadata);
    };
}
/**
 * Normalize a path to ensure it starts with '/' and doesn't end with '/'
 */
function normalizePath(path) {
    // Ensure path starts with '/'
    let normalized = path.startsWith('/') ? path : `/${path}`;
    // Remove trailing slash (except for root '/')
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}
