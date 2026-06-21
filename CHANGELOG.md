# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-06-21

### Added
- **Command-Line Interface (CLI)**:
  - Added the `express-openapi-decorators` CLI tool (via `cac`) to generate and validate OpenAPI documents.
  - Subcommand `generate <config> [output]` to output an OpenAPI spec file in JSON or YAML formats (`--format <format>`), supporting OpenAPI versions 3.0.3 and 3.1.0 (`--openapi <version>`).
  - Subcommand `validate <config>` to validate OpenAPI generation in-memory.
  - Support for configuration files exporting either a plain configuration object or a (synchronous or asynchronous) factory function.
  - Native ES module loading and `tsx` integration for seamless support of TypeScript config files (`.ts` / `.tsx`).
- **Controller Discovery**:
  - `loadControllers(patternOrOptions, options)` helper function to auto-discover and load controller classes using glob patterns (via `fast-glob`).
  - Support for filtering only `@Controller` decorated classes (`decoratedOnly: true`) or returning all class constructors.
- **Swagger UI Integration Helper**:
  - `setupSwaggerUI(host, options)` helper to mount Swagger UI (using `swagger-ui-express`) onto an Express app or router.
  - Lazy loading support: the OpenAPI document source can be a static object, a `Promise`, or a (sync/async) factory function.
  - Serves the raw JSON specification alongside the Swagger UI at `${path}.json` (or a customizable `rawJsonPath`).
  - Option forwarding for custom site titles and Swagger UI configuration options.

### Fixed
- **Metadata Storage Sharing**:
  - Attached the metadata storage singleton to `globalThis` (`__expressOpenApiDecoratorsStorage`), ensuring that the metadata storage is shared across ESM and CommonJS boundaries, preventing empty OpenAPI document generation when mixing ESM and CJS modules.

## [2.3.0] - 2026-06-21

### Added
- `@ApiSchema({ name })` decorator — override the schema name used for a DTO in `components.schemas`. Both the `components.schemas` key and any `$ref` references honor the override.
- `@ApiCallback(name, definition)` and `@ApiCallbacks(definitions)` decorators — declare webhook / callback entries on an operation. The definition is emitted under `operation.callbacks.<name>.<expression>`.
- `@ApiLink({ from, fromField, routeParam })` decorator — declare that the decorated operation exposes a default getter for a resource. Emits a `links` entry on the first response that has content.
- `@ApiDefaultGetter(type)` decorator — marker for the inverse side of `@ApiLink`. Mirrors `@nestjs/swagger` for DX parity; no runtime effect on its own.
- `@ApiResponse({ headers: { ... } })` — response headers are now emitted on the response's `headers` map.
- `@ApiOperation({ tags: [...] })` — method-level tag override. When provided, the controller's `@ApiTags` are ignored for that operation.
- New `ApiProperty` options for polymorphism: `oneOf`, `anyOf`, `allOf`, `discriminator`. Each accepts a list of DTO classes (or a discriminator block) and emits the appropriate composition block in the schema.
- `resolveSchemaName(dtoClass)` — exported helper that returns the effective schema name (override or class name).

### Fixed
- Circular DTO references (self-references and mutual references) no longer cause stack overflow. The schema generator's `collectNestedDtos` uses a visiting set to terminate recursion, and property references are emitted as `$ref` so no inline expansion happens.

## [2.2.0] - 2026-06-21

### Added
- `@ApiHeader` and `@ApiHeaders` decorators — declare HTTP header parameters on a method or controller. Mirrors `@ApiQuery` but with `in: 'header'`.
- `@ApiCookieAuth` decorator — registers an `apiKey` security scheme with `in: 'cookie'` and applies it to a route or controller. Re-exported as a NestJS-compatible alias.
- `@ApiProduces(...mimeTypes)` decorator — declares the response content types produced by an endpoint. Defaults to `application/json` when omitted.
- `@ApiExcludeEndpoint()` and `@ApiExcludeController()` decorators — omit an endpoint or an entire controller from the generated OpenAPI document without affecting runtime routing.
- `@ApiExtraModels(...models)` decorator — register DTO classes so they appear in `components.schemas` even when no operation references them directly (useful for shared error envelopes, polymorphic types, SDK code-gen).
- `@ApiExtension(key, value)` decorator — attach OpenAPI `x-*` extension fields to operations. Throws at runtime when the key is not `x-`-prefixed.
- `@ApiResponseProperty(options)` decorator — shorthand for `@ApiProperty({ readOnly: true })` for response-only fields.
- `@ApiHideProperty()` decorator — exclude a property from the generated DTO schema.
- New `ApiProperty` options: `readOnly`, `writeOnly`, `deprecated`, `hidden`.
- New metadata types exported: `ApiHeaderMetadata`, `ApiProducesMetadata`, `ApiExcludeMetadata`, `ApiExtensionMetadata`.

### Fixed
- `@ApiHeader` and `@ApiHeaders` (the latter being new) correctly emit `in: 'header'` parameters and surface `format` / `enum` / `default` / `deprecated` along with the existing `description` / `example`.
- Path and query parameter helpers (`buildPrimitiveParameterSchema` and its V3.1 variant) are now shared with header generation to keep schema shape consistent.

## [2.1.2] - 2026-06-21

### Fixed
- Multiple `@ApiTags` on the same controller are now merged into a single tag list instead of being overwritten by the first declaration.
- `metadataStorage.clear()` now also clears the module-level schema cache, preventing stale schemas from being served across `createOpenApiDocument` calls (notably in test setups).
- `@Public()` no longer emits an empty `security: [{}]` block on operations; the security requirement is now correctly omitted so Swagger UI does not render the operation as "anonymous only".
- Duplicate security requirements (e.g. applying `@ApiBearerAuth()` twice to the same route) are now deduplicated.
- Properties declared as `Type[]` without an explicit `type` in `@ApiProperty` no longer produce an invalid `{ type: 'array' }` schema (without `items`); the schema generator now falls back to an open array schema.
- Async route handlers registered through `ExpressAdapter` now have their rejections forwarded to Express' error pipeline (Express 4 compatibility).
- `@Controller()` called without arguments no longer crashes with a `Cannot read properties of undefined` error; it now defaults to base path `/`.
- Non-primitive types (DTO classes) used in `@ApiParam` / `@ApiQuery` now produce a `string` parameter with a developer-facing warning instead of an invalid `$ref` schema.
- `@ApiQuery` and `@ApiParam` now support `format`, `enum`, `default` and `deprecated` options; previously these were silently dropped from the generated document.
- Empty DTOs no longer emit a useless `required: []` field in the generated schema.

### Added
- `@ApiQuery` and `@ApiParam` options: `format`, `enum`, `default`, `deprecated`.

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
[2.1.2]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v2.1.2
[2.2.0]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v2.2.0
[2.3.0]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v2.3.0
[2.4.0]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v2.4.0
[0.1.0]: https://github.com/mehmetfiskindal/express-openapi-decorators/releases/tag/v0.1.0
