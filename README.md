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
| `@ApiOperation(options)` | Adds operation metadata (summary, description, operationId, deprecated) |
| `@ApiResponse(status, type)` | Shorthand for response with type |
| `@ApiResponse(options)` | Detailed response configuration |
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

### DTO Decorators

| Decorator | Description |
|-----------|-------------|
| `@ApiProperty(options)` | Defines a property in a DTO |
| `@ApiPropertyOptional(options)` | Defines an optional property (shorthand) |
| `@ApiResponseProperty(options)` | Defines a read-only response-only property |
| `@ApiHideProperty()` | Excludes a property from the DTO schema |

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

## Examples

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

### Completed in 2.2.0
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

### Planned for upcoming releases
- [ ] `@ApiCallback` / `@ApiCallbacks` (webhooks)
- [ ] `@ApiLink` and `@ApiDefaultGetter` (link objects)
- [ ] Polymorphism helpers (`discriminator`, `oneOf`, `anyOf`)
- [ ] Circular DTO reference protection
- [ ] Response headers and `links` on `@ApiResponse`
- [ ] CLI: `npx express-openapi-decorators generate`
- [ ] Auto controller discovery via glob
- [ ] Swagger UI route helper
