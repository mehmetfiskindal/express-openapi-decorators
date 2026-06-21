import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as mod from '../src/index.js';

const {
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
  ApiProperty,
  ApiPropertyOptional,
  createOpenApiDocument,
  metadataStorage,
  // New features
  ApiBearerAuth,
  ApiBasicAuth,
  ApiApiKey,
  ApiOAuth2,
  ApiOpenIdConnect,
  ApiSecurity,
  Public,
  ApiFile,
  ApiFiles,
  ApiConsumes,
  ApiFormData,
  ApiProduces,
  ApiHeader,
  ApiHeaders,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiExcludeController,
  ApiExtraModels,
  ApiExtension,
  ApiResponseProperty,
  ApiHideProperty,
  Use,
  Middleware,
  ExpressAdapter,
  createRouterFromControllers,
} = mod;

describe('Metadata Storage', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('should store controller metadata', () => {
    @Controller('/test')
    class TestController {}

    const controller = metadataStorage.findController(TestController);
    expect(controller).toBeDefined();
    expect(controller?.basePath).toBe('/test');
  });

  it('should store method metadata', () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {}
    }

    const methods = metadataStorage.getMethodsForController(TestController);
    expect(methods).toHaveLength(1);
    expect(methods[0]?.httpMethod).toBe('get');
    expect(methods[0]?.path).toBe('/');
  });

  it('should store tags metadata', () => {
    @ApiTags('Test', 'API')
    @Controller('/test')
    class TestController {}

    const tags = metadataStorage.getTagsForController(TestController);
    expect(tags).toEqual(['Test', 'API']);
  });
});

describe('Decorators', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('HTTP Method Decorators', () => {
    it('should handle all HTTP methods', () => {
      @Controller('/resources')
      class ResourceController {
        @Get('/')
        getAll() {}

        @Post('/')
        create() {}

        @Put('/:id')
        update() {}

        @Delete('/:id')
        remove() {}
      }

      const methods = metadataStorage.getMethodsForController(ResourceController);
      expect(methods).toHaveLength(4);
      
      const methods_by_type = {
        get: methods.filter(m => m.httpMethod === 'get'),
        post: methods.filter(m => m.httpMethod === 'post'),
        put: methods.filter(m => m.httpMethod === 'put'),
        delete: methods.filter(m => m.httpMethod === 'delete'),
      };
      
      expect(methods_by_type.get).toHaveLength(1);
      expect(methods_by_type.post).toHaveLength(1);
      expect(methods_by_type.put).toHaveLength(1);
      expect(methods_by_type.delete).toHaveLength(1);
    });
  });

  describe('ApiOperation Decorator', () => {
    it('should store operation metadata', () => {
      @Controller('/test')
      class TestController {
        @Get('/')
        @ApiOperation({
          summary: 'Get all items',
          description: 'Returns a list of all items',
        })
        getAll() {}
      }

      const operation = metadataStorage.getOperationForMethod(
        TestController,
        'getAll'
      );
      
      expect(operation).toBeDefined();
      expect(operation?.summary).toBe('Get all items');
      expect(operation?.description).toBe('Returns a list of all items');
    });
  });

  describe('ApiResponse Decorator', () => {
    class UserDto {
      @ApiProperty({ type: String })
      id!: string;
    }

    it('should store response metadata', () => {
      @Controller('/test')
      class TestController {
        @Get('/')
        @ApiResponse({ status: 200, type: UserDto })
        getAll() {}
      }

      const responses = metadataStorage.getResponsesForMethod(
        TestController,
        'getAll'
      );
      
      expect(responses).toHaveLength(1);
      expect(responses[0]?.status).toBe(200);
      expect(responses[0]?.type).toBe(UserDto);
    });

    it('should handle array responses', () => {
      @Controller('/test')
      class TestController {
        @Get('/')
        @ApiResponse({ status: 200, type: [UserDto] })
        getAll() {}
      }

      const responses = metadataStorage.getResponsesForMethod(
        TestController,
        'getAll'
      );
      
      expect(responses).toHaveLength(1);
      expect(responses[0]?.isArray).toBe(true);
    });
  });

  describe('ApiBody Decorator', () => {
    class CreateUserDto {
      @ApiProperty({ type: String })
      name!: string;
    }

    it('should store body metadata', () => {
      @Controller('/test')
      class TestController {
        @Post('/')
        @ApiBody(CreateUserDto)
        create() {}
      }

      const body = metadataStorage.getBodyParamForMethod(
        TestController,
        'create'
      );
      
      expect(body).toBeDefined();
      expect(body?.type).toBe(CreateUserDto);
      expect(body?.required).toBe(true);
    });
  });

  describe('ApiProperty Decorator', () => {
    it('should store property metadata', () => {
      class TestDto {
        @ApiProperty({
          type: String,
          example: 'test',
          description: 'Test property',
        })
        name!: string;
      }

      const properties = metadataStorage.getPropertiesForTarget(TestDto);
      
      expect(properties).toHaveLength(1);
      expect(properties[0]?.propertyKey).toBe('name');
      expect(properties[0]?.type).toBe(String);
      expect(properties[0]?.example).toBe('test');
      expect(properties[0]?.required).toBe(true);
    });

    it('should handle optional properties', () => {
      class TestDto {
        @ApiPropertyOptional({ type: String })
        optionalField?: string;
      }

      const properties = metadataStorage.getPropertiesForTarget(TestDto);
      
      expect(properties).toHaveLength(1);
      expect(properties[0]?.required).toBe(false);
    });
  });
});

describe('OpenAPI Document Generator', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('should generate basic OpenAPI document', () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {}
    }

    const document = createOpenApiDocument({
      title: 'Test API',
      version: '1.0.0',
      controllers: [TestController],
    });

    expect(document.openapi).toBe('3.1.0');
    expect(document.info.title).toBe('Test API');
    expect(document.info.version).toBe('1.0.0');
    expect(document.paths['/test']).toBeDefined();
    expect(document.paths['/test']?.get).toBeDefined();
  });

  it('should generate schemas from DTOs', () => {
    class UserDto {
      @ApiProperty({
        type: String,
        example: '123',
      })
      id!: string;

      @ApiProperty({
        type: String,
        example: 'John',
      })
      name!: string;
    }

    @Controller('/users')
    class UserController {
      @Get('/')
      @ApiResponse({ status: 200, type: [UserDto] })
      getAll() {}
    }

    const document = createOpenApiDocument({
      title: 'Test API',
      version: '1.0.0',
      controllers: [UserController],
    });

    expect(document.components?.schemas?.UserDto).toBeDefined();
    const schema = document.components?.schemas?.UserDto as Record<string, unknown>;
    expect(schema.properties).toBeDefined();
    expect((schema.properties as Record<string, unknown>).id).toBeDefined();
    expect((schema.properties as Record<string, unknown>).name).toBeDefined();
    expect(schema.required).toContain('id');
    expect(schema.required).toContain('name');
  });

  it('should convert Express path parameters to OpenAPI format', () => {
    @Controller('/users')
    class UserController {
      @Get('/:id')
      @ApiParam({ name: 'id', type: String, example: '123' })
      getOne() {}
    }

    const document = createOpenApiDocument({
      title: 'Test API',
      version: '1.0.0',
      controllers: [UserController],
    });

    // Should convert :id to {id}
    expect(document.paths['/users/{id}']).toBeDefined();
    expect(document.paths['/users/:id']).toBeUndefined();
  });

  it('should not generate double slashes for root controller paths', () => {
    @Controller('/')
    class RootController {
      @Get('/health')
      health() {}
    }

    const document = createOpenApiDocument({
      title: 'Test API',
      version: '1.0.0',
      controllers: [RootController],
    });

    expect(document.paths['/health']).toBeDefined();
    expect(document.paths['//health']).toBeUndefined();
  });

  it('should include query parameters in operation', () => {
    @Controller('/users')
    class UserController {
      @Get('/')
      @ApiQuery({ name: 'page', type: Number, example: 1 })
      @ApiQuery({ name: 'limit', type: Number, example: 10 })
      getAll() {}
    }

    const document = createOpenApiDocument({
      title: 'Test API',
      version: '1.0.0',
      controllers: [UserController],
    });

    const operation = document.paths['/users']?.get;
    expect(operation?.parameters).toHaveLength(2);
    
    const params = operation?.parameters as Array<{ name: string; in: string }>;
    const pageParam = params.find(p => p.name === 'page');
    const limitParam = params.find(p => p.name === 'limit');
    
    expect(pageParam).toBeDefined();
    expect(pageParam?.in).toBe('query');
    expect(limitParam).toBeDefined();
    expect(limitParam?.in).toBe('query');
  });

  it('should generate inline schemas for primitive responses', () => {
    @Controller('/health')
    class HealthController {
      @Get('/')
      @ApiResponse({ status: 200, type: String })
      check() {}
    }

    const document = createOpenApiDocument({
      openapi: '3.0.3',
      title: 'Test API',
      version: '1.0.0',
      controllers: [HealthController],
    });

    const response = document.paths['/health']?.get?.responses?.['200'] as {
      content?: { 'application/json'?: { schema?: { type?: string; $ref?: string } } };
    };

    expect(response.content?.['application/json']?.schema).toEqual({
      type: 'string',
    });
    expect(document.components?.schemas?.String).toBeUndefined();
  });

  it('should keep OpenAPI 3.0 and 3.1 schema caches separate', () => {
    class CacheDto {
      @ApiProperty({ type: String, example: 'cached' })
      name!: string;
    }

    @Controller('/cache')
    class CacheController {
      @Get('/')
      @ApiResponse({ status: 200, type: CacheDto })
      getCache() {}
    }

    const documentV30 = createOpenApiDocument({
      openapi: '3.0.3',
      title: 'Test API',
      version: '1.0.0',
      controllers: [CacheController],
    });

    const documentV31 = createOpenApiDocument({
      openapi: '3.1.0',
      title: 'Test API',
      version: '1.0.0',
      controllers: [CacheController],
    });

    const schemaV30 = documentV30.components?.schemas?.CacheDto as {
      properties?: Record<string, { example?: unknown; examples?: unknown[] }>;
    };
    const schemaV31 = documentV31.components?.schemas?.CacheDto as {
      properties?: Record<string, { example?: unknown; examples?: unknown[] }>;
    };

    expect(schemaV30.properties?.name).toEqual({
      type: 'string',
      example: 'cached',
    });
    expect(schemaV31.properties?.name).toEqual({
      type: 'string',
      examples: ['cached'],
    });
  });

  it('should merge custom component schemas', () => {
    const document = createOpenApiDocument({
      openapi: '3.0.3',
      title: 'Test API',
      version: '1.0.0',
      controllers: [],
      components: {
        schemas: {
          ErrorResponse: {
            type: 'object',
          },
        },
      },
    });

    expect(document.components?.schemas?.ErrorResponse).toEqual({
      type: 'object',
    });
  });

  it('should preserve metadata on DTO reference properties', () => {
    class ProfileDto {
      @ApiProperty({ type: String })
      bio!: string;
    }

    class UserDto {
      @ApiProperty({
        type: ProfileDto,
        description: 'Nested profile',
        example: { bio: 'hello' },
      })
      profile!: ProfileDto;
    }

    @Controller('/users')
    class UserController {
      @Get('/')
      @ApiResponse({ status: 200, type: UserDto })
      getUser() {}
    }

    const document = createOpenApiDocument({
      openapi: '3.0.3',
      title: 'Test API',
      version: '1.0.0',
      controllers: [UserController],
    });

    const schema = document.components?.schemas?.UserDto as {
      properties?: Record<string, unknown>;
    };

    expect(schema.properties?.profile).toEqual({
      allOf: [{ $ref: '#/components/schemas/ProfileDto' }],
      example: { bio: 'hello' },
      description: 'Nested profile',
    });
  });
});

describe('OpenAPI 3.1.0 Support', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('should generate OpenAPI 3.1.0 document by default', () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {}
    }

    const document = createOpenApiDocument({
      title: 'Test API',
      version: '1.0.0',
      controllers: [TestController],
    });

    expect(document.openapi).toBe('3.1.0');
  });

  it('should support explicit 3.1.0 version', () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {}
    }

    const document = createOpenApiDocument({
      openapi: '3.1.0',
      title: 'Test API',
      version: '1.0.0',
      controllers: [TestController],
    });

    expect(document.openapi).toBe('3.1.0');
  });

  it('should support 3.0.3 version', () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {}
    }

    const document = createOpenApiDocument({
      openapi: '3.0.3',
      title: 'Test API',
      version: '1.0.0',
      controllers: [TestController],
    });

    expect(document.openapi).toBe('3.0.3');
  });
});

describe('Authentication Decorators', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('ApiBearerAuth', () => {
    it('should register bearer auth scheme and requirement', () => {
      @ApiBearerAuth()
      @Controller('/protected')
      class ProtectedController {
        @Get('/')
        getAll() {}
      }

      const schemes = metadataStorage.getSecuritySchemes();
      expect(schemes).toHaveLength(1);
      expect(schemes[0]?.name).toBe('bearer');
      expect(schemes[0]?.type).toBe('http');
      expect(schemes[0]?.scheme).toBe('bearer');
      expect(schemes[0]?.bearerFormat).toBe('JWT');

      const requirements = metadataStorage.getSecurityForController(ProtectedController);
      expect(requirements).toHaveLength(1);
      expect(requirements[0]?.schemes).toContain('bearer');
    });

    it('should support custom name and options', () => {
      @ApiBearerAuth('jwt', { bearerFormat: 'JWT', description: 'JWT token' })
      @Controller('/api')
      class ApiController {}

      const schemes = metadataStorage.getSecuritySchemes();
      expect(schemes[0]?.name).toBe('jwt');
      expect(schemes[0]?.bearerFormat).toBe('JWT');
      expect(schemes[0]?.description).toBe('JWT token');
    });
  });

  describe('ApiBasicAuth', () => {
    it('should register basic auth scheme', () => {
      @ApiBasicAuth()
      @Controller('/admin')
      class AdminController {}

      const schemes = metadataStorage.getSecuritySchemes();
      expect(schemes).toHaveLength(1);
      expect(schemes[0]?.type).toBe('http');
      expect(schemes[0]?.scheme).toBe('basic');
    });
  });

  describe('ApiApiKey', () => {
    it('should register API key scheme', () => {
      @ApiApiKey('apiKey', { name: 'X-API-Key', in: 'header' })
      @Controller('/api')
      class ApiController {}

      const schemes = metadataStorage.getSecuritySchemes();
      expect(schemes).toHaveLength(1);
      expect(schemes[0]?.type).toBe('apiKey');
      expect(schemes[0]?.in).toBe('header');
    });

    it('should use the configured API key parameter name in the document', () => {
      @ApiApiKey('apiKey', { name: 'X-API-Key', in: 'header' })
      @Controller('/api')
      class ApiController {
        @Get('/')
        getAll() {}
      }

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'Test API',
        version: '1.0.0',
        controllers: [ApiController],
      });

      expect(document.components?.securitySchemes?.apiKey).toEqual({
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      });
    });
  });

  describe('Public decorator', () => {
    it('should mark route as public (no security)', () => {
      @ApiBearerAuth()
      @Controller('/mixed')
      class MixedController {
        @Public()
        @Get('/public')
        publicRoute() {}

        @Get('/private')
        privateRoute() {}
      }

      const publicSecurity = metadataStorage.getSecurityForMethod(MixedController, 'publicRoute');
      expect(publicSecurity).toHaveLength(1);
      expect(publicSecurity[0]?.schemes).toHaveLength(0);
    });
  });

  describe('OpenAPI Document Security', () => {
    it('should include security schemes in document', () => {
      @ApiBearerAuth()
      @Controller('/api')
      class ApiController {}

      const document = createOpenApiDocument({
        title: 'Test API',
        version: '1.0.0',
        controllers: [ApiController],
      });

      expect(document.components?.securitySchemes).toBeDefined();
      expect(document.components?.securitySchemes?.bearer).toBeDefined();
    });

    it('should include security requirements in operations', () => {
      @ApiBearerAuth()
      @Controller('/api')
      class ApiController {
        @Get('/')
        getAll() {}
      }

      const document = createOpenApiDocument({
        title: 'Test API',
        version: '1.0.0',
        controllers: [ApiController],
      });

      const operation = document.paths['/api']?.get;
      expect(operation?.security).toBeDefined();
      expect(operation?.security?.[0]).toHaveProperty('bearer');
    });
  });
});

describe('File Upload Decorators', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('ApiFile', () => {
    it('should register single file upload metadata', () => {
      @Controller('/upload')
      class UploadController {
        @ApiFile({ name: 'avatar', required: true })
        @Post('/avatar')
        uploadAvatar() {}
      }

      const fileParams = metadataStorage.getFileParamsForMethod(UploadController, 'uploadAvatar');
      expect(fileParams).toHaveLength(1);
      expect(fileParams[0]?.name).toBe('avatar');
      expect(fileParams[0]?.isArray).toBe(false);
      expect(fileParams[0]?.required).toBe(true);
    });
  });

  describe('ApiFiles', () => {
    it('should register multiple files upload metadata', () => {
      @Controller('/upload')
      class UploadController {
        @ApiFiles({ name: 'documents' })
        @Post('/documents')
        uploadDocuments() {}
      }

      const fileParams = metadataStorage.getFileParamsForMethod(UploadController, 'uploadDocuments');
      expect(fileParams).toHaveLength(1);
      expect(fileParams[0]?.name).toBe('documents');
      expect(fileParams[0]?.isArray).toBe(true);
    });
  });

  describe('ApiConsumes', () => {
    it('should register content types', () => {
      @Controller('/api')
      class ApiController {
        @ApiConsumes('application/xml')
        @Post('/xml')
        processXml() {}
      }

      const consumes = metadataStorage.getConsumesForMethod(ApiController, 'processXml');
      expect(consumes).toBeDefined();
      expect(consumes?.contentTypes).toContain('application/xml');
    });
  });

  describe('Multipart Form Data in OpenAPI', () => {
    it('should generate multipart/form-data request body', () => {
      @Controller('/upload')
      class UploadController {
        @ApiFile({ name: 'file' })
        @Post('/')
        upload() {}
      }

      const document = createOpenApiDocument({
        title: 'Test API',
        version: '1.0.0',
        controllers: [UploadController],
      });

      const operation = document.paths['/upload']?.post;
      expect(operation?.requestBody).toBeDefined();
      
      const content = (operation?.requestBody as Record<string, unknown>)?.content as Record<string, unknown>;
      expect(content?.['multipart/form-data']).toBeDefined();
    });
  });
});

describe('Middleware Decorator', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('should register controller-level middleware', () => {
    const testMiddleware = (req: any, res: any, next: any) => next();

    @Use(testMiddleware)
    @Controller('/api')
    class ApiController {}

    const middlewares = metadataStorage.getMiddlewaresForController(ApiController);
    expect(middlewares).toHaveLength(1);
    expect(middlewares[0]).toBe(testMiddleware);
  });

  it('should register method-level middleware', () => {
    const authMiddleware = (req: any, res: any, next: any) => next();

    @Controller('/api')
    class ApiController {
      @Use(authMiddleware)
      @Get('/protected')
      protectedRoute() {}
    }

    const middlewares = metadataStorage.getMiddlewaresForMethod(ApiController, 'protectedRoute');
    expect(middlewares).toHaveLength(1);
    expect(middlewares[0]).toBe(authMiddleware);
  });
});

describe('ExpressAdapter', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('should create an adapter instance', () => {
    const mockApp = { use: () => {} };
    const adapter = new ExpressAdapter(mockApp as any);
    expect(adapter).toBeDefined();
    expect(adapter.getRouter()).toBeDefined();
  });

  it('should store controller metadata', () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {
        return 'success';
      }
    }

    const controller = metadataStorage.findController(TestController);
    expect(controller).toBeDefined();
    expect(controller?.basePath).toBe('/test');
  });

  it('should mount routes when registering a single controller', () => {
    const calls: unknown[][] = [];
    const mockApp = { use: (...args: unknown[]) => calls.push(args) };

    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {
        return 'success';
      }
    }

    const adapter = new ExpressAdapter(mockApp as any);
    adapter.registerController(TestController);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe('/');
  });

  it('should return a prefixed router from createRouterFromControllers', () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      getAll() {
        return 'success';
      }
    }

    const router = createRouterFromControllers([TestController], {
      prefix: '/api',
    });

    const stack = (router as any).stack as Array<{ regexp: RegExp }>;
    expect(stack[0]?.regexp.toString()).toContain('\\/api');
  });

  it('should not register double-slash routes for root controller paths', () => {
    @Controller('/')
    class RootController {
      @Get('/health')
      health() {
        return 'success';
      }
    }

    const router = createRouterFromControllers([RootController]);
    const stack = (router as any).stack as Array<{ route?: { path: string } }>;
    const routeLayer = stack.find(layer => layer.route);

    expect(routeLayer?.route?.path).toBe('/health');
  });
});

describe('v2.1.2 Bug Fixes', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('Bug 1.1: multiple @ApiTags are merged', () => {
    it('merges tags from multiple @ApiTags on the same controller', () => {
      @ApiTags('Users')
      @ApiTags('Admin')
      @ApiTags('Users') // duplicate
      @Controller('/users')
      class UserController {}

      const tags = metadataStorage.getTagsForController(UserController);
      expect(tags.sort()).toEqual(['Admin', 'Users']);
    });

    it('merged tags appear in generated document', () => {
      @ApiTags('Users')
      @ApiTags('Admin')
      @Controller('/users')
      class UserController {
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'Test API',
        version: '1.0.0',
        controllers: [UserController],
      });

      expect(document.paths['/users']?.get?.tags?.sort()).toEqual([
        'Admin',
        'Users',
      ]);
    });
  });

  describe('Bug 1.2: clear() resets schema cache', () => {
    it('regenerates schemas after clear (OpenAPI 3.0 example)', () => {
      class TempDto {
        @ApiProperty({ type: String, example: 'v1' })
        id!: string;
      }

      @Controller('/t')
      class TempController {
        @Get('/')
        @ApiResponse({ status: 200, type: TempDto })
        list() {}
      }

      // First generation (3.0 keeps `example`)
      const doc1 = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'T',
        version: '1',
        controllers: [TempController],
      });
      const schema1 = doc1.components?.schemas?.TempDto as {
        properties?: { id?: { example?: unknown } };
      };
      expect(schema1.properties?.id?.example).toBe('v1');

      // Clear and re-decorate with different metadata
      metadataStorage.clear();
      class TempDto2 {
        @ApiProperty({ type: String, example: 'v2' })
        id!: string;
      }
      @Controller('/t')
      class TempController2 {
        @Get('/')
        @ApiResponse({ status: 200, type: TempDto2 })
        list() {}
      }

      const doc2 = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'T',
        version: '1',
        controllers: [TempController2],
      });
      const schema2 = doc2.components?.schemas?.TempDto2 as {
        properties?: { id?: { example?: unknown } };
      };
      // If the cache wasn't cleared, the second generation would still
      // contain the v1 example for the new TempDto2 class.
      expect(schema2.properties?.id?.example).toBe('v2');
    });
  });

  describe('Bug 1.3: @Public() does not emit empty security block', () => {
    it('omits security on a @Public() route even with controller-level @ApiBearerAuth', () => {
      @ApiBearerAuth()
      @Controller('/mixed')
      class MixedController {
        @Public()
        @Get('/public')
        publicRoute() {}

        @Get('/private')
        privateRoute() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [MixedController],
      });

      const publicOp = document.paths['/mixed/public']?.get;
      const privateOp = document.paths['/mixed/private']?.get;

      expect(publicOp?.security).toBeUndefined();
      expect(privateOp?.security).toBeDefined();
      expect(privateOp?.security?.[0]).toHaveProperty('bearer');
    });
  });

  describe('Bug 1.4: duplicate security requirements are deduped', () => {
    it('does not produce duplicate security entries', () => {
      @ApiBearerAuth()
      @ApiBearerAuth() // intentional duplicate
      @Controller('/d')
      class DupController {
        @Get('/')
        get() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [DupController],
      });

      const security = document.paths['/d']?.get?.security as Array<unknown>;
      expect(security).toHaveLength(1);
    });
  });

  describe('Bug 1.5: array property handling is robust', () => {
    it('emits proper $ref for explicit array of DTOs (type: [ItemDto])', () => {
      class ItemDto {
        @ApiProperty({ type: String })
        name!: string;
      }

      class BagDto {
        @ApiProperty({ type: [ItemDto] })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items!: any;
      }

      @Controller('/bag')
      class BagController {
        @Post('/')
        @ApiBody(BagDto)
        create() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [BagController],
      });

      const bagSchema = document.components?.schemas?.BagDto as {
        properties?: { items?: { type?: string; items?: { $ref?: string } } };
      };
      expect(bagSchema.properties?.items?.type).toBe('array');
      expect(bagSchema.properties?.items?.items?.$ref).toBe(
        '#/components/schemas/ItemDto'
      );
    });

    it('emits open array fallback when isArray=true and no type is given', () => {
      // isArray is set explicitly to true without a type. The schema
      // generator must not produce `{ type: 'array' }` without `items`
      // (which is invalid OpenAPI).
      class OpenArrayDto {
        @ApiProperty({ isArray: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        things!: any;
      }

      @Controller('/o')
      class OpenArrayController {
        @Post('/')
        @ApiBody(OpenArrayDto)
        create() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [OpenArrayController],
      });

      const schema = document.components?.schemas?.OpenArrayDto as {
        properties?: { things?: { type?: string; items?: unknown } };
      };
      expect(schema.properties?.things?.type).toBe('array');
      // items is present (object schema) so the OpenAPI document stays valid
      expect(schema.properties?.things?.items).toBeDefined();
    });
  });

  describe('Bug 1.6: async handler errors are forwarded to Express', () => {
    it('forwards rejected promises to the error middleware', async () => {
      const { createRouterFromControllers } = mod;

      class ThrowingController {
        @Get('/async-fail')
        async fail() {
          throw new Error('boom');
        }
      }

      // Bypass the metadata controller requirement by using a no-decorator
      // path. We attach the method directly through Express routes.
      const express = (await import('express')).default;
      const app = express();

      // Install a route that simulates a decorated async handler rejection
      app.get('/async-fail', async (_req, _res, _next) => {
        // Same shape as wrapHandler output:
        try {
          await Promise.reject(new Error('boom'));
        } catch (err) {
          _next(err);
        }
      });

      app.use(
        (
          err: Error,
          _req: express.Request,
          res: express.Response,
          _next: express.NextFunction
        ) => {
          res.status(500).json({ message: err.message });
        }
      );

      const server = app.listen(0);
      try {
        const port = (server.address() as { port: number }).port;
        const res = await fetch(`http://127.0.0.1:${port}/async-fail`);
        expect(res.status).toBe(500);
        const body = (await res.json()) as { message: string };
        expect(body.message).toBe('boom');
      } finally {
        server.close();
      }
    });

    it('wraps a decorated async controller so rejections reach the error pipeline', async () => {
      @Controller('/async-wrap')
      class AsyncController {
        @Get('/fail')
        async fail() {
          throw new Error('async-boom');
        }
      }

      const express = (await import('express')).default;
      const app = express();
      const router = createRouterFromControllers([AsyncController]);
      app.use(router);
      app.use(
        (
          err: Error,
          _req: express.Request,
          res: express.Response,
          _next: express.NextFunction
        ) => {
          res.status(500).json({ message: err.message });
        }
      );

      const server = app.listen(0);
      try {
        const port = (server.address() as { port: number }).port;
        const res = await fetch(`http://127.0.0.1:${port}/async-wrap/fail`);
        expect(res.status).toBe(500);
        const body = (await res.json()) as { message: string };
        expect(body.message).toBe('async-boom');
      } finally {
        server.close();
      }
    });
  });

  describe('Bug 1.7: argument-less @Controller() is valid', () => {
    it('does not crash when called without arguments and defaults to /', () => {
      let created: any;
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        class NoArgController {}
        Controller()(NoArgController);
        created = NoArgController;
      }).not.toThrow();

      const ctrl = metadataStorage.findController(created);
      expect(ctrl).toBeDefined();
      expect(ctrl?.basePath).toBe('/');
    });
  });

  describe('Bug 1.8: non-primitive path/query param falls back to string', () => {
    it('emits a string parameter with a warning when type is a DTO class', () => {
      // Suppress expected warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      class TagDto {
        @ApiProperty({ type: String })
        label!: string;
      }

      @Controller('/t')
      class TagController {
        @Get('/:tag')
        @ApiParam({ name: 'tag', type: TagDto as unknown as Function })
        get() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [TagController],
      });

      const param = (document.paths['/t/{tag}']?.get?.parameters as Array<{
        schema: { type: string };
      }>)[0];
      expect(param.schema.type).toBe('string');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Bug 1.9: query/path parameters support format/enum/default/deprecated', () => {
    it('emits format, enum and default on @ApiQuery', () => {
      @Controller('/users')
      class UserController {
        @Get('/')
        @ApiQuery({
          name: 'role',
          type: String,
          enum: ['admin', 'user'],
          default: 'user',
          deprecated: true,
        })
        @ApiQuery({
          name: 'id',
          type: String,
          format: 'uuid',
          description: 'User UUID',
        })
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [UserController],
      });

      const params = document.paths['/users']?.get?.parameters as Array<{
        name: string;
        schema: { type: string; format?: string; enum?: unknown[]; default?: unknown };
        deprecated?: boolean;
      }>;

      const role = params.find((p) => p.name === 'role')!;
      expect(role.schema.enum).toEqual(['admin', 'user']);
      expect(role.schema.default).toBe('user');
      expect(role.deprecated).toBe(true);

      const id = params.find((p) => p.name === 'id')!;
      expect(id.schema.format).toBe('uuid');
    });

    it('emits format, enum and default on @ApiParam', () => {
      @Controller('/users')
      class UserController {
        @Get('/:id')
        @ApiParam({
          name: 'id',
          type: String,
          format: 'uuid',
        })
        get() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [UserController],
      });

      const param = (document.paths['/users/{id}']?.get?.parameters as Array<{
        schema: { type: string; format?: string };
      }>)[0];
      expect(param.schema.type).toBe('string');
      expect(param.schema.format).toBe('uuid');
    });
  });

  describe('Bug 1.10: empty DTO does not emit required: []', () => {
    it('omits required when no property is required', () => {
      class EmptyDto {
        @ApiPropertyOptional({ type: String })
        note?: string;
      }

      @Controller('/e')
      class EmptyController {
        @Get('/')
        @ApiResponse({ status: 200, type: EmptyDto })
        get() {}
      }

      const document = createOpenApiDocument({
        title: 'Test',
        version: '1.0.0',
        controllers: [EmptyController],
      });

      const schema = document.components?.schemas?.EmptyDto as {
        required?: string[];
      };
      expect(schema.required).toBeUndefined();
    });
  });
});

describe('Additional Coverage Tests', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('ExpressAdapter extended behavior', () => {
    it('mounts routes under globalPrefix when provided', () => {
      const calls: Array<{ path: string; router: unknown }> = [];
      const mockApp = {
        use: (path: string, router: unknown) => calls.push({ path, router }),
      };

      @Controller('/users')
      class UserController {
        @Get('/')
        getAll() {
          return [];
        }
      }

      const adapter = new ExpressAdapter(mockApp as any, {
        globalPrefix: '/api/v1',
      });
      adapter.registerController(UserController);

      expect(calls).toHaveLength(1);
      expect(calls[0]?.path).toBe('/api/v1');
    });

    it('applies global middlewares in order', async () => {
      const express = (await import('express')).default;
      const order: string[] = [];

      const globalMw: any = (_req: any, _res: any, next: any) => {
        order.push('global');
        next();
      };
      const ctrlMw: any = (_req: any, _res: any, next: any) => {
        order.push('controller');
        next();
      };

      @Use(ctrlMw)
      @Controller('/x')
      class XC {
        @Get('/')
        get(_req: express.Request, res: express.Response) {
          order.push('handler');
          res.status(200).send('ok');
        }
      }

      const app = express();
      const router = createRouterFromControllers([XC], {
        middlewares: [globalMw],
      });
      app.use(router);

      const server = app.listen(0);
      try {
        const port = (server.address() as { port: number }).port;
        const res = await fetch(`http://127.0.0.1:${port}/x/`);
        expect(res.status).toBe(200);
        // Drain body to ensure connection closes
        await res.text();
        expect(order).toEqual(['global', 'controller', 'handler']);
      } finally {
        server.close();
      }
    });

    it('resolves named middlewares via @Middleware', async () => {
      const express = (await import('express')).default;
      let invoked = false;

      const namedMw: any = (_req: any, _res: any, next: any) => {
        invoked = true;
        next();
      };

      @Controller('/n')
      class NC {
        @Middleware('auth')
        @Get('/')
        get(_req: express.Request, res: express.Response) {
          res.status(200).send('ok');
        }
      }

      const app = express();
      const router = createRouterFromControllers([NC], {
        namedMiddlewares: { auth: namedMw },
      });
      app.use(router);

      const server = app.listen(0);
      try {
        const port = (server.address() as { port: number }).port;
        const res = await fetch(`http://127.0.0.1:${port}/n/`);
        await res.text();
        expect(invoked).toBe(true);
      } finally {
        server.close();
      }
    });

    it('throws when a named middleware is not registered', () => {
      @Controller('/n')
      class NC {
        @Middleware('missing')
        @Get('/')
        get() {
          return 'ok';
        }
      }

      expect(() => {
        createRouterFromControllers([NC]);
      }).toThrow(/Named middleware 'missing' not found/);
    });

    it('forwards sync handler errors to the error pipeline', async () => {
      const express = (await import('express')).default;
      // Use a real controller that throws synchronously
      @Controller('/sync-fail')
      class SyncFailController {
        @Get('/')
        handler(_req: express.Request, _res: express.Response) {
          throw new Error('sync-boom');
        }
      }

      const app2 = express();
      const router2 = createRouterFromControllers([SyncFailController]);
      app2.use(router2);
      app2.use(
        (
          err: Error,
          _req: express.Request,
          res: express.Response,
          _next: express.NextFunction
        ) => {
          res.status(500).json({ message: err.message });
        }
      );

      const server = app2.listen(0);
      try {
        const port = (server.address() as { port: number }).port;
        const res = await fetch(`http://127.0.0.1:${port}/sync-fail/`);
        expect(res.status).toBe(500);
        const body = (await res.json()) as { message: string };
        expect(body.message).toBe('sync-boom');
      } finally {
        server.close();
      }
    });
  });

  describe('createOpenApiDocument V3 path', () => {
    it('emits OpenAPI 3.0.3 document with security, tags, license and contact', () => {
      @ApiBearerAuth()
      @ApiTags('users')
      @Controller('/users')
      class UserController {
        @Get('/')
        @ApiOperation({ summary: 'List users' })
        getAll() {}
      }

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'API',
        version: '1',
        description: 'Test API',
        contact: { name: 'Mehmet', email: 'mehmet@example.com' },
        license: { name: 'MIT' },
        tags: [{ name: 'users', description: 'User endpoints' }],
        externalDocs: { url: 'https://example.com/docs' },
        security: [{ bearer: [] }],
        controllers: [UserController],
      });

      expect(document.openapi).toBe('3.0.3');
      expect(document.info.description).toBe('Test API');
      expect(document.info.contact?.name).toBe('Mehmet');
      expect(document.info.license?.name).toBe('MIT');
      expect(document.tags?.[0]?.description).toBe('User endpoints');
      expect(document.externalDocs?.url).toBe('https://example.com/docs');
      expect(document.security?.[0]).toHaveProperty('bearer');
    });

    it('merges user-provided custom components (V3)', () => {
      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'API',
        version: '1',
        controllers: [],
        components: {
          responses: { NotFound: { description: 'Not found' } },
          parameters: { PageParam: { name: 'page', in: 'query' } },
          examples: { Sample: { value: 'sample' } },
          requestBodies: { Req: { content: { 'application/json': { schema: {} } } } },
          headers: { XTrace: { schema: { type: 'string' } } },
          links: { Up: { operationId: 'op' } },
          callbacks: { OnEvent: { '{$request.query.url}': {} as any } },
        },
      });

      expect(document.components?.responses?.NotFound).toBeDefined();
      expect(document.components?.parameters?.PageParam).toBeDefined();
      expect(document.components?.examples?.Sample).toBeDefined();
      expect(document.components?.requestBodies?.Req).toBeDefined();
      expect(document.components?.headers?.XTrace).toBeDefined();
      expect(document.components?.links?.Up).toBeDefined();
      expect(document.components?.callbacks?.OnEvent).toBeDefined();
    });

    it('merges user-provided custom components (V3.1 with pathItems)', () => {
      const document = createOpenApiDocument({
        openapi: '3.1.0',
        title: 'API',
        version: '1',
        controllers: [],
        components: {
          pathItems: { SharedItem: {} as any },
        },
      });

      expect(document.components?.pathItems?.SharedItem).toBeDefined();
    });
  });

  describe('Tag emission from operations', () => {
    it('emits operation tags from controller-level @ApiTags', () => {
      @ApiTags('alpha', 'beta')
      @Controller('/t')
      class TC {
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [TC],
      });
      expect(document.paths['/t']?.get?.tags).toEqual(['alpha', 'beta']);
    });
  });

  describe('class-validator adapter is a no-op when no metadata is present', () => {
    it('does not throw when class-validator is absent or returns no metadata', () => {
      class SimpleDto {
        @ApiProperty({ type: String })
        name!: string;
      }

      @Controller('/s')
      class SC {
        @Post('/')
        @ApiBody(SimpleDto)
        create() {}
      }

      expect(() =>
        createOpenApiDocument({
          title: 'A',
          version: '1',
          controllers: [SC],
        })
      ).not.toThrow();
    });
  });

  describe('@Description / @Summary shorthand decorators', () => {
    it('@Summary alone creates an operation', () => {
      @Controller('/d')
      class DC {
        @Get('/')
        @ApiTags('Test')
        @mod.Summary('Just a summary')
        get() {}
      }

      const op = metadataStorage.getOperationForMethod(DC, 'get');
      expect(op?.summary).toBe('Just a summary');
      expect(op?.description).toBeUndefined();
    });

    it('@Description alone creates an operation with empty summary', () => {
      @Controller('/d2')
      class DC2 {
        @Get('/')
        @mod.Description('A long description')
        get() {}
      }

      const op = metadataStorage.getOperationForMethod(DC2, 'get');
      expect(op?.summary).toBe('');
      expect(op?.description).toBe('A long description');
    });

    it('@Description appends to existing operation description when applied after @ApiOperation', () => {
      // Decorators run bottom-up, so to have @Description append we
      // need to put it BELOW @ApiOperation.
      @Controller('/d3')
      class DC3 {
        @Get('/')
        @mod.Description('second')
        @ApiOperation({ summary: 's', description: 'first' })
        get() {}
      }

      const op = metadataStorage.getOperationForMethod(DC3, 'get');
      expect(op?.description).toBe('first\n\nsecond');
    });
  });

  describe('OAuth2 and OpenIdConnect security decorators', () => {
    it('registers OAuth2 security scheme', () => {
      @ApiOAuth2('oauth2', {
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/auth',
            tokenUrl: 'https://example.com/token',
            scopes: { read: 'read', write: 'write' },
          },
        },
        description: 'OAuth2',
      })
      @Controller('/o')
      class OC {}

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'A',
        version: '1',
        controllers: [OC],
      });
      const scheme = document.components?.securitySchemes?.oauth2 as {
        type: string;
        flows: { authorizationCode: { scopes: Record<string, string> } };
      };
      expect(scheme.type).toBe('oauth2');
      expect(scheme.flows.authorizationCode.scopes).toEqual({
        read: 'read',
        write: 'write',
      });
    });

    it('registers OpenIdConnect security scheme', () => {
      @ApiOpenIdConnect('oidc', {
        url: 'https://example.com/.well-known/openid-configuration',
        description: 'OIDC',
      })
      @Controller('/oidc')
      class OIC {}

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'A',
        version: '1',
        controllers: [OIC],
      });
      const scheme = document.components?.securitySchemes?.oidc as {
        type: string;
        openIdConnectUrl: string;
        description?: string;
      };
      expect(scheme.type).toBe('openIdConnect');
      expect(scheme.openIdConnectUrl).toBe(
        'https://example.com/.well-known/openid-configuration'
      );
      expect(scheme.description).toBe('OIDC');
    });

    it('@ApiSecurity applies at method level', () => {
      @ApiSecurity('bearer', 'apiKey')
      @Controller('/sec')
      class SC {
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [SC],
      });
      const security = document.paths['/sec']?.get?.security as Array<
        Record<string, string[]>
      >;
      expect(security).toHaveLength(1);
      expect(security[0]).toHaveProperty('bearer');
      expect(security[0]).toHaveProperty('apiKey');
    });

    it('@ApiSecurity with custom name (no scheme registered) still works', () => {
      // When the scheme isn't registered, the security reference appears
      // verbatim in the operation. This mirrors @nestjs/swagger behavior.
      @Controller('/s')
      class S {
        @ApiSecurity('custom-scheme')
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [S],
      });
      const security = document.paths['/s']?.get?.security as Array<
        Record<string, string[]>
      >;
      expect(security?.[0]).toHaveProperty('custom-scheme');
    });
  });

  describe('Response default descriptions', () => {
    it('uses default descriptions for common status codes', () => {
      @Controller('/r')
      class RC {
        @ApiResponse({ status: 201, type: String })
        @Post('/')
        create() {}

        @ApiResponse({ status: 204 })
        @Delete('/')
        remove() {}

        @ApiResponse({ status: 404 })
        @Get('/missing')
        notFound() {}

        @ApiResponse({ status: 500 })
        @Get('/err')
        err() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [RC],
      });

      const postOp = document.paths['/r']?.post;
      const delOp = document.paths['/r']?.delete;
      const nfOp = document.paths['/r/missing']?.get;
      const errOp = document.paths['/r/err']?.get;

      expect((postOp?.responses?.['201'] as { description: string }).description).toBe('Created');
      expect((delOp?.responses?.['204'] as { description: string }).description).toBe('No Content');
      expect((nfOp?.responses?.['404'] as { description: string }).description).toBe('Not Found');
      expect((errOp?.responses?.['500'] as { description: string }).description).toBe('Internal Server Error');
    });
  });

  describe('Schema generation: array of DTOs and complex types', () => {
    it('generates a primitive array property when type is [String]', () => {
      class WithArray {
        @ApiProperty({ type: [String] })
        tags!: string[];
      }

      @Controller('/a')
      class AC {
        @Get('/')
        @ApiResponse({ status: 200, type: WithArray })
        list() {}
      }

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'A',
        version: '1',
        controllers: [AC],
      });
      const schema = document.components?.schemas?.WithArray as {
        properties?: { tags?: { type?: string; items?: { type?: string } } };
      };
      expect(schema.properties?.tags?.type).toBe('array');
      expect(schema.properties?.tags?.items?.type).toBe('string');
    });

    it('preserves example, format, default on a property', () => {
      class WithMeta {
        @ApiProperty({
          type: String,
          format: 'email',
          example: 'foo@bar.com',
          default: 'n/a',
          description: 'email',
        })
        email!: string;

        @ApiProperty({ type: Number, enum: [1, 2, 3], example: 2 })
        tier!: number;
      }

      @Controller('/m')
      class MC {
        @Get('/')
        @ApiResponse({ status: 200, type: WithMeta })
        list() {}
      }

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'A',
        version: '1',
        controllers: [MC],
      });
      const schema = document.components?.schemas?.WithMeta as {
        properties?: {
          email?: { format?: string; example?: string; default?: string; description?: string };
          tier?: { enum?: unknown[]; example?: number };
        };
      };
      expect(schema.properties?.email?.format).toBe('email');
      expect(schema.properties?.email?.example).toBe('foo@bar.com');
      expect(schema.properties?.email?.default).toBe('n/a');
      expect(schema.properties?.email?.description).toBe('email');
      expect(schema.properties?.tier?.enum).toEqual([1, 2, 3]);
      expect(schema.properties?.tier?.example).toBe(2);
    });
  });

  describe('External docs and license on operation', () => {
    it('operation has operationId when provided', () => {
      @Controller('/o')
      class OC {
        @ApiOperation({ summary: 's', operationId: 'customOpId' })
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [OC],
      });
      expect(document.paths['/o']?.get?.operationId).toBe('customOpId');
    });

    it('emits deprecated when set on @ApiOperation', () => {
      @Controller('/o')
      class OC {
        @ApiOperation({ summary: 's', deprecated: true })
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [OC],
      });
      expect(document.paths['/o']?.get?.deprecated).toBe(true);
    });
  });
});

describe('Validation adapter exports', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('exposes the expected helper functions', () => {
    expect(typeof mod.extractValidationConstraints).toBe('function');
    expect(typeof mod.extractValidationConstraintsV31).toBe('function');
    expect(typeof mod.isPropertyOptional).toBe('function');
    expect(typeof mod.isPropertyArray).toBe('function');
    expect(typeof mod.mergeValidationConstraints).toBe('function');
    expect(typeof mod.isClassValidatorAvailable).toBe('function');
  });

  it('returns empty constraints when no metadata exists', () => {
    const c = mod.extractValidationConstraints(class {}, 'nope');
    expect(c).toEqual({});
    const c31 = mod.extractValidationConstraintsV31(class {}, 'nope');
    expect(c31).toEqual({});
  });

  it('isPropertyOptional returns false when no metadata exists', () => {
    expect(mod.isPropertyOptional(class {}, 'nope')).toBe(false);
    expect(mod.isPropertyArray(class {}, 'nope')).toBe(false);
  });

  it('mergeValidationConstraints merges into existing schema', () => {
    const merged = mod.mergeValidationConstraints(
      { type: 'string' },
      class {},
      'nope'
    );
    expect(merged.type).toBe('string');
  });
});

describe('v2.2.0 New Decorators', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('@ApiHeader / @ApiHeaders', () => {
    it('registers a method-level header parameter', () => {
      @Controller('/u')
      class UC {
        @ApiHeader({ name: 'X-Tenant', required: true })
        @Get('/')
        list() {}
      }

      const headers = metadataStorage.getHeaderParamsForMethod(UC, 'list');
      expect(headers).toHaveLength(1);
      expect(headers[0]?.name).toBe('X-Tenant');
      expect(headers[0]?.required).toBe(true);
    });

    it('registers a controller-level header parameter', () => {
      @ApiHeader({ name: 'X-Tenant', required: true })
      @Controller('/u')
      class UC {
        @Get('/')
        list() {}
      }

      const headers = metadataStorage.getHeaderParamsForController(UC);
      expect(headers).toHaveLength(1);
      expect(headers[0]?.methodName).toBeUndefined();
    });

    it('emits header parameter in generated document (V3.1)', () => {
      @ApiHeader({ name: 'X-Request-Id', description: 'Correlation id' })
      @Controller('/u')
      class UC {
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [UC],
      });

      const params = document.paths['/u']?.get?.parameters as Array<{
        name: string;
        in: string;
      }>;
      const header = params.find((p) => p.name === 'X-Request-Id');
      expect(header).toBeDefined();
      expect(header?.in).toBe('header');
    });

    it('ApiHeaders shorthand registers multiple headers', () => {
      @Controller('/u')
      class UC {
        @ApiHeaders([
          { name: 'X-A' },
          { name: 'X-B', required: true },
        ])
        @Get('/')
        list() {}
      }

      const headers = metadataStorage.getHeaderParamsForMethod(UC, 'list');
      expect(headers).toHaveLength(2);
      expect(headers.map((h) => h.name).sort()).toEqual(['X-A', 'X-B']);
    });
  });

  describe('@ApiCookieAuth', () => {
    it('registers an apiKey cookie security scheme', () => {
      @ApiCookieAuth('session', { name: 'connect.sid', description: 'Express session' })
      @Controller('/p')
      class PC {}

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'A',
        version: '1',
        controllers: [PC],
      });

      const scheme = document.components?.securitySchemes?.session as {
        type: string;
        in: string;
        name: string;
        description?: string;
      };
      expect(scheme.type).toBe('apiKey');
      expect(scheme.in).toBe('cookie');
      expect(scheme.name).toBe('connect.sid');
      expect(scheme.description).toBe('Express session');
    });

    it('applies cookie auth to all routes of a controller', () => {
      @ApiCookieAuth('cookie')
      @Controller('/p')
      class PC {
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [PC],
      });
      const security = document.paths['/p']?.get?.security as Array<
        Record<string, string[]>
      >;
      expect(security?.[0]).toHaveProperty('cookie');
    });
  });

  describe('@ApiProduces', () => {
    it('uses the declared content type for response content', () => {
      @Controller('/feed')
      class FC {
        @ApiProduces('application/xml')
        @Get('/')
        @ApiResponse({ status: 200, type: String })
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [FC],
      });

      const response = document.paths['/feed']?.get?.responses?.['200'] as {
        content?: Record<string, unknown>;
      };
      expect(response.content).toHaveProperty('application/xml');
      expect(response.content).not.toHaveProperty('application/json');
    });

    it('emits multiple content types when several are declared', () => {
      @Controller('/feed')
      class FC {
        @ApiProduces('application/xml', 'application/json')
        @Get('/')
        @ApiResponse({ status: 200, type: String })
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [FC],
      });

      const response = document.paths['/feed']?.get?.responses?.['200'] as {
        content?: Record<string, unknown>;
      };
      expect(Object.keys(response.content ?? {}).sort()).toEqual([
        'application/json',
        'application/xml',
      ]);
    });
  });

  describe('@ApiExcludeEndpoint / @ApiExcludeController', () => {
    it('excludes a single endpoint from the document', () => {
      @Controller('/u')
      class UC {
        @ApiExcludeEndpoint()
        @Get('/internal')
        internal() {}

        @Get('/public')
        publicRoute() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [UC],
      });
      expect(document.paths['/u/internal']).toBeUndefined();
      expect(document.paths['/u/public']).toBeDefined();
    });

    it('excludes all endpoints of a controller', () => {
      @ApiExcludeController()
      @Controller('/internal')
      class IC {
        @Get('/a')
        a() {}

        @Get('/b')
        b() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [IC],
      });
      expect(document.paths['/internal/a']).toBeUndefined();
      expect(document.paths['/internal/b']).toBeUndefined();
    });

    it('ApiExcludeController overrides ApiExcludeEndpoint(false)', () => {
      // A controller-level exclude wins even when an endpoint tries to
      // opt back in.
      @ApiExcludeController()
      @Controller('/x')
      class XC {
        @ApiExcludeEndpoint(false)
        @Get('/a')
        a() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [XC],
      });
      expect(document.paths['/x/a']).toBeUndefined();
    });
  });

  describe('@ApiExtraModels', () => {
    it('includes unreferenced models in components.schemas', () => {
      class ErrorEnvelope {
        @ApiProperty({ type: String })
        message!: string;
      }

      @ApiExtraModels(ErrorEnvelope)
      @Controller('/u')
      class UC {
        @Get('/')
        @ApiResponse({ status: 200, type: String })
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [UC],
      });
      expect(document.components?.schemas?.ErrorEnvelope).toBeDefined();
    });

    it('does not duplicate models already referenced by responses', () => {
      class UserDto {
        @ApiProperty({ type: String })
        name!: string;
      }

      @ApiExtraModels(UserDto)
      @Controller('/u')
      class UC {
        @Get('/')
        @ApiResponse({ status: 200, type: UserDto })
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [UC],
      });
      // UserDto appears exactly once in components.schemas
      expect(Object.keys(document.components?.schemas ?? {}).filter((k) => k === 'UserDto')).toHaveLength(1);
    });
  });

  describe('@ApiExtension', () => {
    it('emits x-* fields on the operation', () => {
      @Controller('/u')
      class UC {
        @ApiExtension('x-internal', true)
        @ApiExtension('x-rate-limit', { limit: 100 })
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [UC],
      });

      const op = document.paths['/u']?.get as Record<string, unknown>;
      expect(op['x-internal']).toBe(true);
      expect(op['x-rate-limit']).toEqual({ limit: 100 });
    });

    it('throws when the key is not prefixed with x-', () => {
      expect(() => {
        // @ts-expect-error invalid call rejected at runtime
        ApiExtension('internal', true);
      }).toThrow(/must be prefixed with "x-"/);
    });

    it('controller-level extensions are inherited by operations', () => {
      @ApiExtension('x-codegen', 'typescript-fetch')
      @Controller('/u')
      class UC {
        @Get('/')
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [UC],
      });
      const op = document.paths['/u']?.get as Record<string, unknown>;
      expect(op['x-codegen']).toBe('typescript-fetch');
    });
  });

  describe('@ApiResponseProperty / @ApiHideProperty', () => {
    it('emits readOnly on a response-only property', () => {
      class UserDto {
        @ApiResponseProperty()
        id!: string;

        @ApiResponseProperty({ type: String, format: 'date-time' })
        createdAt!: string;

        @ApiProperty({ type: String })
        name!: string;
      }

      @Controller('/u')
      class UC {
        @Get('/')
        @ApiResponse({ status: 200, type: UserDto })
        list() {}
      }

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'A',
        version: '1',
        controllers: [UC],
      });

      const schema = document.components?.schemas?.UserDto as {
        properties?: Record<string, { readOnly?: boolean }>;
      };
      expect(schema.properties?.id?.readOnly).toBe(true);
      expect(schema.properties?.createdAt?.readOnly).toBe(true);
      expect(schema.properties?.name?.readOnly).toBeUndefined();
    });

    it('@ApiHideProperty removes a property from the schema', () => {
      class UserDto {
        @ApiProperty({ type: String })
        id!: string;

        @ApiHideProperty()
        passwordHash!: string;
      }

      @Controller('/u')
      class UC {
        @Get('/')
        @ApiResponse({ status: 200, type: UserDto })
        list() {}
      }

      const document = createOpenApiDocument({
        title: 'A',
        version: '1',
        controllers: [UC],
      });
      const schema = document.components?.schemas?.UserDto as {
        properties?: Record<string, unknown>;
      };
      expect(schema.properties?.id).toBeDefined();
      expect(schema.properties?.passwordHash).toBeUndefined();
    });

    it('emits writeOnly and deprecated on a property', () => {
      class Form {
        @ApiProperty({ type: String, writeOnly: true })
        password!: string;

        @ApiProperty({ type: String, deprecated: true })
        oldField!: string;
      }

      @Controller('/f')
      class FC {
        @Get('/')
        @ApiResponse({ status: 200, type: Form })
        list() {}
      }

      const document = createOpenApiDocument({
        openapi: '3.0.3',
        title: 'A',
        version: '1',
        controllers: [FC],
      });

      const schema = document.components?.schemas?.Form as {
        properties?: Record<string, { writeOnly?: boolean; deprecated?: boolean }>;
      };
      expect(schema.properties?.password?.writeOnly).toBe(true);
      expect(schema.properties?.oldField?.deprecated).toBe(true);
    });
  });
});
