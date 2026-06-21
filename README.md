# Express OpenAPI Decorators

[![npm version](https://img.shields.io/npm/v/@developersailor/express-openapi-decorators.svg)](https://www.npmjs.com/package/@developersailor/express-openapi-decorators)
[![npm downloads](https://img.shields.io/npm/dm/@developersailor/express-openapi-decorators.svg)](https://www.npmjs.com/package/@developersailor/express-openapi-decorators)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@developersailor/express-openapi-decorators)](https://nodejs.org/)

> NestJS-like Swagger decorators for Express.js and TypeScript.

Generate OpenAPI 3.0 documentation from TypeScript decorators without writing YAML, JSON, or JSDoc comments.

## Features

- 🎯 **No YAML** - No more writing OpenAPI YAML files
- 📝 **No JSDoc** - No more @swagger JSDoc comments
- 🚀 **NestJS-like DX** - Similar developer experience to NestJS
- 📦 **DTO-based Schemas** - Automatic schema generation from decorated DTO classes
- ⚡ **Express-friendly** - Designed for Express.js applications
- 🔷 **TypeScript-first** - Full TypeScript support

## Installation

```bash
# npm
npm install @developersailor/express-openapi-decorators reflect-metadata

# yarn
yarn add @developersailor/express-openapi-decorators reflect-metadata

# pnpm
pnpm add @developersailor/express-openapi-decorators reflect-metadata
```

### Peer Dependencies

This package requires `reflect-metadata` to be installed alongside it:

```bash
npm install reflect-metadata
```

Also make sure you have Express and swagger-ui-express installed:

```bash
npm install express swagger-ui-express
npm install -D @types/express @types/swagger-ui-express
```

## Quick Start

### 1. Enable Decorators

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. Import Reflect Metadata

At the top of your entry file:

```typescript
import 'reflect-metadata';
```

### 3. Create DTOs with @ApiProperty

```typescript
import { ApiProperty, ApiPropertyOptional } from '@developersailor/express-openapi-decorators';

export class UserDto {
  @ApiProperty({
    type: String,
    example: 'user_123',
    description: 'Unique user identifier',
  })
  id!: string;

  @ApiProperty({
    type: String,
    example: 'Mehmet',
    description: 'User name',
  })
  name!: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'mehmet@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiPropertyOptional({
    type: Number,
    example: 25,
    description: 'User age',
  })
  age?: number;

  @ApiProperty({
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
    description: 'User account status',
  })
  status!: 'active' | 'inactive' | 'suspended';

  @ApiProperty({
    type: [String],
    example: ['admin', 'user'],
    description: 'User roles',
  })
  roles!: string[];
}

export class CreateUserDto {
  @ApiProperty({
    type: String,
    example: 'Mehmet',
    description: 'User name',
  })
  name!: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'mehmet@example.com',
    description: 'User email address',
  })
  email!: string;
}
```

### 4. Create Controllers with Decorators

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@developersailor/express-openapi-decorators';
import { Request, Response } from 'express';
import { UserDto, CreateUserDto } from './dto/user.dto';

@ApiTags('Users')
@Controller('/users')
export class UserController {
  @Get('/')
  @ApiOperation({
    summary: 'List all users',
    description: 'Returns a paginated list of all users in the system',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
    description: 'Number of items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    type: [UserDto], // Array response
  })
  listUsers(req: Request, res: Response) {
    // Your implementation
    res.json({ users: [] });
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns detailed information about a specific user',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: 'user_123',
    description: 'User unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  getUser(req: Request, res: Response) {
    // Your implementation
    res.json({ id: req.params.id });
  }

  @Post('/')
  @ApiOperation({
    summary: 'Create new user',
    description: 'Creates a new user account with the provided information',
  })
  @ApiBody(CreateUserDto)
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserDto,
  })
  createUser(req: Request, res: Response) {
    // Your implementation
    res.status(201).json({ id: 'new_user_123' });
  }

  @Put('/:id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates all fields of an existing user',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: 'user_123',
  })
  @ApiBody(CreateUserDto)
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserDto,
  })
  updateUser(req: Request, res: Response) {
    // Your implementation
    res.json({ id: req.params.id });
  }

  @Delete('/:id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently removes a user from the system',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: 'user_123',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  deleteUser(req: Request, res: Response) {
    // Your implementation
    res.status(204).send();
  }
}
```

### 5. Generate OpenAPI Document

```typescript
import 'reflect-metadata';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createOpenApiDocument } from '@developersailor/express-openapi-decorators';
import { UserController } from './controllers/user.controller';

const app = express();
app.use(express.json());

// Generate OpenAPI document
const openApiDocument = createOpenApiDocument({
  title: 'My API',
  description: 'API documentation for my application',
  version: '1.0.0',
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  controllers: [UserController],
});

// Setup Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Your routes...
app.get('/users', (req, res) => {
  // Implementation
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Swagger UI available at http://localhost:3000/docs');
});
```

## Available Decorators

### Controller Decorators

| Decorator | Description |
|-----------|-------------|
| `@Controller(path)` | Marks a class as an API controller with a base path |
| `@ApiTags(...tags)` | Adds OpenAPI tags to all endpoints in the controller |
| `@ApiExcludeController()` | Excludes every endpoint of the controller from the generated OpenAPI document |
| `@ApiExtraModels(...models)` | Registers DTO classes to appear in `components.schemas` even when not directly referenced |
| `@ApiHeader(options)` | Controller-level request header parameter |
| `@ApiHeaders([...])` | Controller-level shorthand for multiple headers |
| `@ApiExtension(key, value)` | Controller-level OpenAPI `x-*` extension |

### HTTP Method Decorators

| Decorator | Description |
|-----------|-------------|
| `@Get(path?)` | Marks a method as a GET endpoint |
| `@Post(path?)` | Marks a method as a POST endpoint |
| `@Put(path?)` | Marks a method as a PUT endpoint |
| `@Patch(path?)` | Marks a method as a PATCH endpoint |
| `@Delete(path?)` | Marks a method as a DELETE endpoint |

### Endpoint Decorators

| Decorator | Description |
|-----------|-------------|
| `@ApiOperation(options)` | Adds operation metadata (summary, description, operationId, deprecated, tags) |
| `@ApiResponse(status, type)` | Shorthand for response with type |
| `@ApiResponse(options)` | Detailed response configuration (supports `headers`) |
| `@ApiBody(DtoClass)` | Shorthand for request body |
| `@ApiBody(options)` | Detailed request body configuration |
| `@ApiQuery(options)` | Adds a query parameter |
| `@ApiParam(options)` | Adds a path parameter |
| `@ApiHeader(options)` | Adds a request header parameter |
| `@ApiHeaders([...])` | Adds multiple request header parameters at once |
| `@ApiConsumes(...types)` | Declares request content types |
| `@ApiProduces(...types)` | Declares response content types |
| `@ApiFile(options)` | Marks the endpoint as accepting a single file upload |
| `@ApiFiles(options)` | Marks the endpoint as accepting multiple file uploads |
| `@ApiExcludeEndpoint()` | Excludes a single endpoint from the OpenAPI document |
| `@ApiExtension(key, value)` | Attaches an OpenAPI `x-*` extension to the operation |
| `@ApiCallback(name, definition)` | Declares a webhook / callback on the operation |
| `@ApiCallbacks(definitions)` | Declares multiple named callbacks on the operation |
| `@ApiLink({ from, fromField, routeParam })` | Declares the operation as a default getter for a linked resource |
| `@ApiDefaultGetter(type)` | Marker for the inverse side of `@ApiLink` |

### DTO Decorators

| Decorator | Description |
|-----------|-------------|
| `@ApiProperty(options)` | Defines a property in a DTO (supports `oneOf` / `anyOf` / `allOf` / `discriminator` for polymorphism) |
| `@ApiPropertyOptional(options)` | Defines an optional property (shorthand) |
| `@ApiResponseProperty(options)` | Defines a read-only response-only property |
| `@ApiHideProperty()` | Excludes a property from the DTO schema |
| `@ApiSchema({ name })` | Overrides the schema name used in `components.schemas` and `$ref` |

### Security Decorators

| Decorator | Description |
|-----------|-------------|
| `@ApiBearerAuth(name?, options?)` | Registers a Bearer / JWT security scheme |
| `@ApiBasicAuth(name?, description?)` | Registers a Basic auth security scheme |
| `@ApiApiKey(name, options)` | Registers an API key (query / header / cookie) security scheme |
| `@ApiCookieAuth(name?, options?)` | Registers a cookie-based security scheme (sugar over `ApiApiKey({ in: 'cookie' })`) |
| `@ApiOAuth2(name?, options)` | Registers an OAuth 2.0 security scheme |
| `@ApiOpenIdConnect(name?, options)` | Registers an OpenID Connect security scheme |
| `@ApiSecurity(...names)` | References one or more already-registered security schemes |
| `@Public()` | Marks a route as having no security requirements |

## @ApiProperty Options

```typescript
@ApiProperty({
  type: String,              // Property type (String, Number, Boolean, or DTO class)
  example: 'value',          // Example value
  description: 'A field',    // Field description
  required: true,            // Whether field is required (default: true)
  enum: ['a', 'b', 'c'],     // Enum values
  format: 'email',           // OpenAPI format (email, date-time, uuid, etc.)
  default: 'default',        // Default value
})
```

For arrays:
```typescript
@ApiProperty({
  type: [UserDto],           // Array of DTOs
})
roles!: UserDto[];
```

## API Reference

### createOpenApiDocument

```typescript
const document = createOpenApiDocument({
  // OpenAPI version (default: '3.0.3')
  openapi?: string;
  
  // Required
  title: string;
  
  // Optional
  description?: string;
  
  // Required
  version: string;
  
  // Optional
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  
  // Required - Controller classes
  controllers: Function[];
  
  // Optional
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  
  // Optional
  license?: {
    name: string;
    url?: string;
  };
});
```

## CLI

The package ships with a small CLI for producing and validating
OpenAPI documents outside the runtime — useful for code generation
pipelines, CI checks, and committing spec snapshots.

### `generate`

```bash
express-openapi-decorators generate <config-file> [output-file] [options]
```

| Flag | Default | Description |
| --- | --- | --- |
| `--format` | `json` | `json` or `yaml` |
| `--openapi` | `3.1.0` | `3.0.3` or `3.1.0` |

The config file is a plain object (or a function returning one) that
the CLI loads and feeds into `createOpenApiDocument`. The simplest form:

```ts
// openapi.config.ts
import { UserController } from './src/user.controller.js';
import { PostController } from './src/post.controller.js';

export default {
  openapi: '3.1.0',
  title: 'My API',
  version: '1.0.0',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [UserController, PostController],
};
```

Run it:

```bash
express-openapi-decorators generate openapi.config.ts openapi.json
express-openapi-decorators generate openapi.config.ts openapi.yaml --format yaml
```

For TypeScript configs the CLI uses your project's installed `tsx`
(an optional peer dependency). Install once and the CLI picks it up
automatically:

```bash
npm install -D tsx
```

> **Why is `tsx` optional?** Bundling it would add ~50MB to the
> install. Most users only need it if they keep their config in
> TypeScript; a plain `openapi.config.js` works without it.

### `validate`

```bash
express-openapi-decorators validate <config-file>
```

Builds the document in memory and runs a few sanity checks
(presence of `info.title` / `info.version`, non-empty `paths`). Exits
with code 0 on success, non-zero on failure. Useful as a CI step:

```json
{
  "scripts": {
    "openapi:check": "express-openapi-decorators validate openapi.config.ts"
  }
}
```

## Auto Controller Discovery

`loadControllers(pattern, options?)` finds and imports controller
files matching a glob, returning the decorated class constructors
they export.

```ts
// openapi.config.ts
import { loadControllers } from '@developersailor/express-openapi-decorators';

export default {
  title: 'My API',
  version: '1.0.0',
  controllers: await loadControllers('src/controllers/**/*.controller.ts'),
};
```

| Option | Default | Description |
| --- | --- | --- |
| `cwd` | `process.cwd()` | Working directory for glob resolution |
| `ignore` | `['**/node_modules/**', '**/dist/**']` | Glob patterns to skip |
| `decoratedOnly` | `true` | If `false`, return any exported class (not just `@Controller`-decorated ones) |

`loadControllers` requires `tsx` for `.ts` files; for plain `.js`
configs no extra dependency is needed.

## Swagger UI Setup

`setupSwaggerUI(app, options)` mounts a Swagger UI endpoint and a
raw-JSON endpoint on an Express app or router.

```ts
import express from 'express';
import {
  setupSwaggerUI,
  createOpenApiDocument,
} from '@developersailor/express-openapi-decorators';
import { UserController } from './user.controller.js';

const app = express();
const document = createOpenApiDocument({
  openapi: '3.1.0',
  title: 'My API',
  version: '1.0.0',
  controllers: [UserController],
});

setupSwaggerUI(app, {
  path: '/docs',          // default
  rawJsonPath: '/openapi.json',  // default: `${path}.json`
  document,               // pre-built, or a () => Document, or Promise<Document>
});

app.listen(3000);
```

| Option | Default | Description |
| --- | --- | --- |
| `path` | `/docs` | Mount path for the Swagger UI HTML |
| `rawJsonPath` | `${path}.json` | Path for the raw OpenAPI document |
| `document` | required | Document object, factory, or Promise |
| `customSiteTitle` | `API Documentation` | Browser title |
| `swaggerOptions` | `{}` | Extra options passed to swagger-ui-express |

The `document` option is resolved lazily on the first request to
`path` or `rawJsonPath` and cached for the lifetime of the process.
This is useful when the document depends on data only available at
runtime (e.g. database-driven controllers).

## Examples

The `examples/` directory contains five runnable apps that demonstrate
specific features in isolation. Each one is a self-contained
package with its own `package.json`, `openapi.config.ts`, and
`README.md` walking you through how to run it.

| Example | What it shows |
| --- | --- |
| [`examples/basic`](./examples/basic/) | Minimal CRUD: `@Controller`, `@Get` / `@Post`, `@ApiResponse`, `@ApiBody` |
| [`examples/auth`](./examples/auth/) | `@ApiBearerAuth` + `@Use(middleware)` for protected routes, and `@Public()` for anonymous ones |
| [`examples/upload`](./examples/upload/) | `@ApiConsumes('multipart/form-data')` + `@ApiFile` for a single upload field |
| [`examples/polymorphism`](./examples/polymorphism/) | `@ApiProperty({ oneOf, discriminator })` for typed unions |
| [`examples/advanced`](./examples/advanced/) | Combines `@ApiExtension`, `@ApiCallback`, `@ApiExcludeEndpoint`, and security decorators |

To run any of them:

```bash
cd examples/basic
npm install
npm link @developersailor/express-openapi-decorators
npm start          # http://localhost:3000
npm run openapi    # writes ./openapi.json
```

### Array Response

```typescript
@ApiResponse({
  status: 200,
  description: 'List of users',
  type: [UserDto],  // Note the array syntax
})
getAllUsers() {}
```

### Multiple Responses

```typescript
@ApiResponse({
  status: 200,
  description: 'User found',
  type: UserDto,
})
@ApiResponse({
  status: 404,
  description: 'User not found',
  type: ErrorDto,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
getUser() {}
```

### Query Parameters

```typescript
@ApiQuery({
  name: 'search',
  type: String,
  required: false,
  description: 'Search term',
})
@ApiQuery({
  name: 'page',
  type: Number,
  required: false,
  example: 1,
})
searchUsers() {}
```

### Path Parameters

```typescript
@ApiParam({
  name: 'id',
  type: String,
  required: true,
  description: 'User ID',
})
getUserById() {}
```

## Migration from `@nestjs/swagger`

This package provides a NestJS-compatible developer experience without
the NestJS framework. The decorator surface is a strict subset of
`@nestjs/swagger` — most code that decorates a NestJS controller
will work here with only the import path changed.

| `@nestjs/swagger` | `@developersailor/express-openapi-decorators` |
| --- | --- |
| `import { ApiProperty } from '@nestjs/swagger'` | `import { ApiProperty } from '@developersailor/express-openapi-decorators'` |
| `import { Controller, Get } from '@nestjs/common'` | `import { Controller, Get } from '@developersailor/express-openapi-decorators'` |
| `import { NestFactory } from '@nestjs/core'` | `import express from 'express'; const app = express();` |
| `SwaggerModule.createDocument(app, options)` | `createOpenApiDocument(options)` |
| `SwaggerModule.setup('/docs', app, document)` | `setupSwaggerUI(app, { path: '/docs', document })` |
| `class UserDto { @ApiProperty() name: string; }` | identical |

### Things that don't translate

- **Dependency injection.** There is no `Module` / `Provider` system.
  Controllers are plain classes; you wire them up yourself with
  `createRouterFromControllers([UserController])`.
- **Built-in validation pipe.** This package only generates docs.
  Pair with `class-validator` + a manual middleware, or use a
  framework like `zod`.
- **WebSocket / GraphQL decorators.** Out of scope; the package is
  REST-focused.
- **Plugin-based TypeScript transformer.** `@nestjs/swagger` ships
  a `tsc` plugin that adds metadata at compile time. This package
  relies on `emitDecoratorMetadata` (the TypeScript compiler flag),
  which is the same approach as `class-validator` and `typeorm`.

### Example migration

A NestJS controller:

```ts
// Before (NestJS)
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get(':id')
  @ApiResponse({ status: 200, type: UserDto })
  getOne(@Param('id') id: string) { /* ... */ }
}
```

The equivalent in this package:

```ts
// After
import { Controller, Get, Param, ApiTags, ApiResponse } from '@developersailor/express-openapi-decorators';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('/users')
export class UserController {
  // No constructor DI — pass dependencies in manually
  constructor(private readonly users: UserService = new UserService()) {}

  @Get('/:id')
  @ApiResponse({ status: 200, type: UserDto })
  getOne(@Param('id') id: string) { /* ... */ }
}
```

The rest of the wiring (router, validators, error handlers) is your
responsibility — that's the price of not using a framework.

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0
- `experimentalDecorators: true` in tsconfig.json
- `emitDecoratorMetadata: true` in tsconfig.json

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Roadmap

### Completed in 2.4.0
- [x] Core decorator system
- [x] DTO schema generation
- [x] Query, path, and header parameters
- [x] Authentication decorators (`@ApiBearerAuth`, `@ApiBasicAuth`, `@ApiApiKey`, `@ApiCookieAuth`, `@ApiOAuth2`, `@ApiOpenIdConnect`)
- [x] File upload support (`@ApiFile`, `@ApiFiles`, `@ApiFormData`)
- [x] Validation integration (class-validator)
- [x] Route registration helper (`ExpressAdapter`, `createRouterFromControllers`)
- [x] OpenAPI 3.0.3 and 3.1.0 support
- [x] `@ApiExcludeEndpoint` / `@ApiExcludeController`
- [x] `@ApiExtraModels`
- [x] `@ApiExtension` (`x-*` fields)
- [x] `@ApiResponseProperty` / `@ApiHideProperty`
- [x] `@ApiProduces` (response content types)
- [x] `@ApiHeader` / `@ApiHeaders`
- [x] `@ApiSchema` (schema name override)
- [x] `@ApiCallback` / `@ApiCallbacks` (webhooks)
- [x] `@ApiLink` / `@ApiDefaultGetter` (link objects)
- [x] Polymorphism: `oneOf` / `anyOf` / `allOf` / `discriminator` on `@ApiProperty`
- [x] Circular DTO reference protection
- [x] Response headers on `@ApiResponse`
- [x] Method-level tag override on `@ApiOperation`
- [x] CLI: `generate` and `validate` commands
- [x] Auto controller discovery via `loadControllers()`
- [x] `setupSwaggerUI()` helper
- [x] Five runnable examples in `examples/`

### Planned for upcoming releases
- [ ] CLI `serve` command (local Swagger UI preview)
- [ ] CLI `watch` mode (auto-regenerate on file change)
- [ ] Schema migration tool (diff between two versions)
