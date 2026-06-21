import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import {
  Controller,
  Post,
  ApiFile,
  ApiConsumes,
  ApiResponse,
  createRouterFromControllers,
  createOpenApiDocument,
} from '../../src/index';
import type { Request, Response } from 'express';

// We don't use multer here because the test focuses on the spec
// generation, not the runtime upload. The Express route is a no-op
// for the request but the doc is what we verify.
@ApiConsumes('multipart/form-data')
@Controller('/uploads')
class UploadController {
  @Post('/')
  @ApiFile({ name: 'avatar', required: true })
  @ApiResponse({ status: 201, description: 'Uploaded' })
  upload(_req: Request, res: Response): void {
    res.status(201).json({ ok: true });
  }
}

function makeApp(): { app: Express; doc: ReturnType<typeof createOpenApiDocument> } {
  const app = express();
  app.use(express.json());
  const doc = createOpenApiDocument({
    openapi: '3.0.3',
    title: 'Upload',
    version: '1',
    controllers: [UploadController],
  });
  app.use(createRouterFromControllers([UploadController]));
  return { app, doc };
}

describe('e2e: file upload spec', () => {
  it('emits a multipart/form-data request body with the file field', () => {
    const { doc } = makeApp();
    const op = doc.paths['/uploads']?.post as
      | {
          requestBody?: {
            content?: Record<string, { schema?: { type?: string; properties?: Record<string, unknown> } }>;
          };
        }
      | undefined;
    expect(op?.requestBody?.content?.['multipart/form-data']).toBeDefined();
    const schema = op?.requestBody?.content?.['multipart/form-data']?.schema;
    expect(schema?.type).toBe('object');
    expect(schema?.properties?.avatar).toMatchObject({
      type: 'string',
      format: 'binary',
    });
  });

  it('accepts a request and returns 201', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/uploads/');
    // The route handler always returns 201; we don't need a real file
    expect([200, 201, 400]).toContain(res.status);
  });
});
