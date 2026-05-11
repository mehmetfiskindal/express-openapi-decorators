import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
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
  Use,
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
