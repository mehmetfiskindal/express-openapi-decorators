import express from 'express';
import 'reflect-metadata';
import {
  createRouterFromControllers,
  setupSwaggerUI,
  createOpenApiDocument,
} from '@developersailor/express-openapi-decorators';
import { UploadController } from './upload.controller.js';

const app = express();
app.use(express.json());

const document = createOpenApiDocument({
  openapi: '3.1.0',
  title: 'Upload Example API',
  version: '1.0.0',
  description: 'Multipart file upload example',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [UploadController],
});

app.use(createRouterFromControllers([UploadController]));
setupSwaggerUI(app, { path: '/docs', document });

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Upload example: http://localhost:3000');
  // eslint-disable-next-line no-console
  console.log('Swagger UI:  http://localhost:3000/docs');
});
