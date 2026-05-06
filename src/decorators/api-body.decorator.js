"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiBody = ApiBody;
const metadata_storage_js_1 = require("../metadata/metadata-storage.js");
function ApiBody(typeOrOptions) {
    return (target, propertyKey, _descriptor) => {
        let type;
        let required = true;
        let description;
        if (typeof typeOrOptions === 'function') {
            type = typeOrOptions;
        }
        else {
            type = typeOrOptions.type;
            required = typeOrOptions.required ?? true;
            description = typeOrOptions.description;
        }
        const metadata = {
            target: target.constructor,
            methodName: propertyKey,
            type,
            required,
            description,
        };
        metadata_storage_js_1.metadataStorage.addBodyParam(metadata);
    };
}
