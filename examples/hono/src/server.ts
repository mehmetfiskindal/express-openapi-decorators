import 'reflect-metadata';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import {
  createHonoAppFromControllers,
  setupSwaggerUI,
  createOpenApiDocument,
} from 'openapi-decorators';
import { UserController } from './user.controller.js';

const app = new Hono();

const document = createOpenApiDocument({
  openapi: '3.1.0',
  title: 'Hono Example API',
  version: '1.0.0',
  description: 'Hono + openapi-decorators full integration example',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [UserController],
});

// Mount OpenAPI controllers to Hono
app.route('/', createHonoAppFromControllers([UserController]));

// Mount Swagger UI at /docs
setupSwaggerUI(app, { path: '/docs', document });

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    // eslint-disable-next-line no-console
    console.log(`Hono server running at http://localhost:${info.port}`);
    // eslint-disable-next-line no-console
    console.log(`Swagger UI available at http://localhost:${info.port}/docs`);
  }
);
