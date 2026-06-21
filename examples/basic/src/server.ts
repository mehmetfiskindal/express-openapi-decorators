import express from 'express';
import 'reflect-metadata';
import { createRouterFromControllers, setupSwaggerUI, createOpenApiDocument } from '@developersailor/express-openapi-decorators';
import { UserController } from './user.controller.js';

const app = express();
app.use(express.json());

const document = createOpenApiDocument({
  openapi: '3.1.0',
  title: 'Basic Example API',
  version: '1.0.0',
  description: 'Minimal CRUD example using express-openapi-decorators',
  servers: [{ url: 'http://localhost:3000', description: 'Local' }],
  controllers: [UserController],
});

app.use(createRouterFromControllers([UserController]));
setupSwaggerUI(app, { path: '/docs', document });

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Basic example: http://localhost:3000');
  // eslint-disable-next-line no-console
  console.log('Swagger UI:  http://localhost:3000/docs');
});
