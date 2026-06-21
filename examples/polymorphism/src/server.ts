import express from 'express';
import 'reflect-metadata';
import {
  createRouterFromControllers,
  setupSwaggerUI,
  createOpenApiDocument,
} from '@developersailor/express-openapi-decorators';
import { PetController } from './pet.controller.js';

const app = express();
app.use(express.json());

const document = createOpenApiDocument({
  openapi: '3.1.0',
  title: 'Polymorphism Example API',
  version: '1.0.0',
  description: 'Demonstrates oneOf + discriminator',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [PetController],
});

app.use(createRouterFromControllers([PetController]));
setupSwaggerUI(app, { path: '/docs', document });

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Polymorphism example: http://localhost:3000');
  // eslint-disable-next-line no-console
  console.log('Swagger UI:  http://localhost:3000/docs');
});
