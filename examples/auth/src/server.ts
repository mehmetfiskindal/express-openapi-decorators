import express from 'express';
import 'reflect-metadata';
import {
  createRouterFromControllers,
  setupSwaggerUI,
  createOpenApiDocument,
} from '@developersailor/express-openapi-decorators';
import { ProfileController } from './profile.controller.js';

const app = express();
app.use(express.json());

const document = createOpenApiDocument({
  openapi: '3.1.0',
  title: 'Auth Example API',
  version: '1.0.0',
  description: 'Bearer-token authentication example',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [ProfileController],
});

app.use(createRouterFromControllers([ProfileController]));
setupSwaggerUI(app, { path: '/docs', document });

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Auth example: http://localhost:3000');
  // eslint-disable-next-line no-console
  console.log('Swagger UI:  http://localhost:3000/docs');
});
