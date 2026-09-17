import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import {
  Controller,
  Get,
  metadataStorage,
  createOpenApiDocument,
  setupHonoSwaggerUI,
  setupSwaggerUI,
} from '../../src/index';

describe('Hono Swagger UI: setupHonoSwaggerUI', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  it('serves raw OpenAPI JSON at /docs.json', async () => {
    @Controller('/items')
    class ItemController {
      @Get('/')
      getItems() {
        return [];
      }
    }

    const app = new Hono();
    const doc = createOpenApiDocument({
      title: 'Hono API',
      version: '1.0.0',
      controllers: [ItemController],
    });

    setupHonoSwaggerUI(app, {
      path: '/docs',
      document: doc,
    });

    const res = await app.request('/docs.json');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.info.title).toBe('Hono API');
    expect(body.paths['/items']).toBeDefined();
  });

  it('serves Swagger UI HTML at /docs', async () => {
    @Controller('/items')
    class ItemController {
      @Get('/')
      getItems() {
        return [];
      }
    }

    const app = new Hono();
    const doc = createOpenApiDocument({
      title: 'Hono API',
      version: '1.0.0',
      controllers: [ItemController],
    });

    setupHonoSwaggerUI(app, {
      path: '/docs',
      document: doc,
      customSiteTitle: 'My Hono Docs',
    });

    const res = await app.request('/docs');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<title>My Hono Docs</title>');
    expect(html).toContain('swagger-ui-bundle.js');
    expect(html).toContain('/docs.json');
  });

  it('works with universal setupSwaggerUI helper when passed a Hono app', async () => {
    @Controller('/pets')
    class PetController {
      @Get('/')
      getPets() {
        return ['cat', 'dog'];
      }
    }

    const app = new Hono();
    const doc = createOpenApiDocument({
      title: 'Universal Docs',
      version: '2.0.0',
      controllers: [PetController],
    });

    setupSwaggerUI(app, {
      path: '/api-docs',
      document: doc,
    });

    const jsonRes = await app.request('/api-docs.json');
    expect(jsonRes.status).toBe(200);
    const jsonBody = await jsonRes.json();
    expect(jsonBody.info.title).toBe('Universal Docs');

    const htmlRes = await app.request('/api-docs');
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('swagger-ui');
  });

  it('supports lazy document resolution function in Hono Swagger UI', async () => {
    let generated = false;
    const docFactory = () => {
      generated = true;
      return createOpenApiDocument({
        title: 'Lazy Hono API',
        version: '1.0.0',
        controllers: [],
      });
    };

    const app = new Hono();
    setupHonoSwaggerUI(app, {
      path: '/docs',
      document: docFactory,
    });

    expect(generated).toBe(false);
    const res = await app.request('/docs.json');
    expect(res.status).toBe(200);
    expect(generated).toBe(true);
  });
});
