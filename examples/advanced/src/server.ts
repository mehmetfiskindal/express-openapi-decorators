import express from 'express';
import 'reflect-metadata';
import {
  createRouterFromControllers,
  setupSwaggerUI,
  createOpenApiDocument,
} from '@developersailor/express-openapi-decorators';
import { OrderController } from './order.controller.js';

const app = express();
app.use(express.json());

const document = createOpenApiDocument({
  openapi: '3.1.0',
  title: 'Advanced Example API',
  version: '1.0.0',
  description: 'Kitchen-sink example combining many decorators',
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Orders', description: 'Customer order management' },
  ],
  controllers: [OrderController],
});

app.use(createRouterFromControllers([OrderController]));
setupSwaggerUI(app, { path: '/docs', document });

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Advanced example: http://localhost:3000');
  // eslint-disable-next-line no-console
  console.log('Swagger UI:  http://localhost:3000/docs');
});
