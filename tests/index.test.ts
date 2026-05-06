import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
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
  ApiProperty,
  ApiPropertyOptional,
  createOpenApiDocument,
  metadataStorage,
} from '../src/index.js';

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

    expect(document.openapi).toBe('3.0.3');
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
});
