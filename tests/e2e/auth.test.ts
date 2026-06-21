import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import {
  Controller,
  Get,
  ApiBearerAuth,
  ApiResponse,
  Public,
  Use,
  ApiTags,
  createRouterFromControllers,
  createOpenApiDocument,
} from '../../src/index';
import type { Request, Response, NextFunction } from 'express';

function bearerAuth(req: Request, res: Response, next: NextFunction): void {
  const h = req.header('authorization');
  if (!h || !h.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

@ApiBearerAuth('bearer', { bearerFormat: 'JWT' })
@ApiTags('Profile')
@Controller('/profile')
@Use(bearerAuth)
class ProfileController {
  @Get('/')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(_req: Request, res: Response): void {
    res.json({ id: 'user-1' });
  }
}

@ApiTags('Public')
@Controller('/public')
class PublicController {
  @Public()
  @Get('/ping')
  @ApiResponse({ status: 200, description: 'Pong' })
  ping(_req: Request, res: Response): void {
    res.json({ pong: true });
  }
}

function makeApp(): { app: Express; doc: ReturnType<typeof createOpenApiDocument> } {
  const app = express();
  app.use(express.json());
  const doc = createOpenApiDocument({
    openapi: '3.1.0',
    title: 'Auth',
    version: '1',
    controllers: [ProfileController, PublicController],
  });
  app.use(createRouterFromControllers([ProfileController, PublicController]));
  return { app, doc };
}

describe('e2e: auth + public', () => {
  it('returns 401 without bearer token', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/profile/');
    expect(res.status).toBe(401);
  });

  it('returns 200 with bearer token', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .get('/profile/')
      .set('Authorization', 'Bearer fake-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'user-1' });
  });

  it('public route works without a token', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/public/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pong: true });
  });

  it('generated doc has bearer security on protected operation, none on public', () => {
    const { doc } = makeApp();
    expect(doc.components?.securitySchemes?.bearer).toBeDefined();
    const profileOp = doc.paths['/profile']?.get as
      | { security?: unknown[] }
      | undefined;
    const publicOp = doc.paths['/public/ping']?.get as
      | { security?: unknown[] }
      | undefined;
    expect(profileOp?.security).toBeDefined();
    expect(publicOp?.security).toBeUndefined();
  });
});
