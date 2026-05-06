# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v0.1.0
