"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenApiDocument = createOpenApiDocument;
const schema_generator_js_1 = require("./schema-generator.js");
const path_generator_js_1 = require("./path-generator.js");
/**
 * Create OpenAPI 3.0.3 document from decorated controllers
 *
 * @example
 * ```typescript
 * import { createOpenApiDocument } from 'express-openapi-decorators';
 * import { UserController } from './controllers/user.controller';
 *
 * const document = createOpenApiDocument({
 *   title: 'My API',
 *   version: '1.0.0',
 *   description: 'API documentation for my application',
 *   controllers: [UserController],
 *   servers: [
 *     { url: 'http://localhost:3000', description: 'Local server' }
 *   ]
 * });
 *
 * // Use with swagger-ui-express
 * app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));
 * ```
 */
function createOpenApiDocument(options) {
    const document = {
        openapi: options.openapi ?? '3.0.3',
        info: {
            title: options.title,
            version: options.version,
        },
        paths: {},
        components: {
            schemas: {},
        },
    };
    // Add optional info fields
    if (options.description) {
        document.info.description = options.description;
    }
    if (options.contact) {
        document.info.contact = options.contact;
    }
    if (options.license) {
        document.info.license = options.license;
    }
    // Add servers if provided
    if (options.servers && options.servers.length > 0) {
        document.servers = options.servers;
    }
    // Generate paths from controllers
    document.paths = (0, path_generator_js_1.generatePaths)(options.controllers);
    // Generate schemas from DTOs
    if (document.components) {
        document.components.schemas = (0, schema_generator_js_1.generateSchemas)();
    }
    return document;
}
