"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = ApiResponse;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
function ApiResponse(statusOrOptions, typeArg) {
    return (target, propertyKey, _descriptor) => {
        let status;
        let type;
        let description;
        let isArray = false;
        if (typeof statusOrOptions === 'number') {
            status = statusOrOptions;
            if (typeArg) {
                if (Array.isArray(typeArg)) {
                    type = typeArg[0];
                    isArray = true;
                }
                else {
                    type = typeArg;
                }
            }
        }
        else {
            status = statusOrOptions.status;
            description = statusOrOptions.description;
            if (statusOrOptions.type) {
                if (Array.isArray(statusOrOptions.type)) {
                    type = statusOrOptions.type[0];
                    isArray = true;
                }
                else {
                    type = statusOrOptions.type;
                }
            }
        }
        const metadata = {
            target: target.constructor,
            methodName: propertyKey,
            status,
            description,
            type,
            isArray,
        };
        metadata_storage_js_1.metadataStorage.addResponse(metadata);
    };
}
