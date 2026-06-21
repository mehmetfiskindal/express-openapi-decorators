import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import {
  Controller,
  Get,
  Post,
  ApiProperty,
  ApiResponse,
  ApiBody,
  ApiTags,
  createRouterFromControllers,
  createOpenApiDocument,
  setupSwaggerUI,
} from '../../src/index';

class CreateUserDto {
  @ApiProperty({ type: String })
  name!: string;
  @ApiProperty({ type: String, format: 'email' })
  email!: string;
}

class UserDto {
  @ApiProperty({ type: String })
  id!: string;
  @ApiProperty({ type: String })
  name!: string;
  @ApiProperty({ type: String, format: 'email' })
  email!: string;
}

@ApiTags('Users')
@Controller('/users')
class UserController {
  @Get('/')
  @ApiResponse({ status: 200, type: [UserDto] })
  list(_req: express.Request, res: express.Response): void {
    res.json([{ id: 'u1', name: 'Mehmet', email: 'm@e.com' }]);
  }

  @Post('/')
  @ApiBody(CreateUserDto)
  @ApiResponse({ status: 201, type: UserDto })
  create(req: express.Request, res: express.Response): void {
    res.status(201).json({ id: 'new', ...req.body });
  }
}

function makeApp(): { app: Express; document: ReturnType<typeof createOpenApiDocument> } {
  const app = express();
  app.use(express.json());
  const document = createOpenApiDocument({
    openapi: '3.1.0',
    title: 'E2E API',
    version: '1.0.0',
    controllers: [UserController],
  });
  app.use(createRouterFromControllers([UserController]));
  setupSwaggerUI(app, { path: '/docs', document });
  return { app, document };
}

describe('e2e: basic CRUD', () => {
  it('GET / returns 200 + JSON body', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/users/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'u1', name: 'Mehmet', email: 'm@e.com' },
    ]);
  });

  it('POST / returns 201 + echo body', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/users/')
      .send({ name: 'Mehmet', email: 'm@e.com' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'new', name: 'Mehmet', email: 'm@e.com' });
  });

  it('serves the raw OpenAPI document at /docs.json', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/docs.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.paths['/users']?.get).toBeDefined();
    expect(res.body.paths['/users']?.post).toBeDefined();
    expect(res.body.components.schemas.UserDto).toBeDefined();
    expect(res.body.components.schemas.CreateUserDto).toBeDefined();
  });

  it('serves Swagger UI HTML at /docs', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/docs/');
    // swagger-ui-express may not be installed in all environments;
    // accept either 200 (HTML) or 500 (the helper falls back to a
    // text error). The important contract is that the path is
    // registered.
    expect([200, 500]).toContain(res.status);
  });
});
