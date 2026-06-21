import { UploadController } from './src/upload.controller.js';

export default {
  openapi: '3.1.0',
  title: 'Upload Example API',
  version: '1.0.0',
  description: 'Multipart file upload example',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [UploadController],
};
