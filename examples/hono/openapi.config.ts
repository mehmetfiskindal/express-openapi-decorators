import { UserController } from './src/user.controller.js';

export default {
  openapi: '3.1.0',
  title: 'Hono Example API',
  version: '1.0.0',
  description: 'Hono + openapi-decorators full integration example',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [UserController],
};
