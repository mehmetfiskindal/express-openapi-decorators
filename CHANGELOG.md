# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-05-12

### Fixed
- Fixed API key security schemes so the generated OpenAPI document uses the configured header, query, or cookie parameter name instead of the internal scheme key.
- Fixed primitive request and response schemas (`String`, `Number`, `Boolean`, `Object`) so they are emitted inline instead of being treated as DTO component references.
- Fixed custom `components.schemas` merging so user-provided schemas are preserved alongside generated DTO schemas.
- Fixed nested DTO reference properties so metadata such as `description`, `example`, and `default` is retained in generated schemas.
- Fixed `@Controller('/')` route generation to avoid double-slash OpenAPI paths and Express routes.
- Fixed OpenAPI 3.0 and 3.1 schema cache isolation so generating one document version no longer affects the other.
- Fixed `ExpressAdapter.registerController()` so single-controller registration mounts routes correctly.
- Fixed `createRouterFromControllers({ prefix })` so the returned router honors the configured prefix.
- Fixed `createRouterFromControllers()` option handling so an undefined `controllerFactory` no longer overrides the default factory.

### Changed
- Removed noisy debug logging from the test suite.
- Expanded regression coverage for OpenAPI schema generation, API key security schemes, route prefixing, root controller paths, and schema cache behavior.

## [0.1.0] - 2024-01-15

### Added
- Initial release of express-openapi-decorators
- Core decorator system with @Controller, @Get, @Post, @Put, @Patch, @Delete
- DTO decorators: @ApiProperty, @ApiPropertyOptional
- Endpoint decorators: @ApiOperation, @ApiResponse, @ApiBody, @ApiQuery, @ApiParam
- Controller decorators: @ApiTags
- OpenAPI 3.0.3 document generation via createOpenApiDocument()
- Automatic schema generation from decorated DTO classes
- Support for array types in responses and properties
- Support for enum types
- Full TypeScript support with type declarations
- ESM and CommonJS dual module support

### Features
- Generate OpenAPI documentation without YAML or JSDoc
- NestJS-like developer experience
- Express.js integration
- TypeScript-first design
- Path parameter auto-detection and conversion
- Query parameter documentation
- Request body schema generation

[2.1.1]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v2.1.1
[0.1.0]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v0.1.0
