import { loadControllers } from '@developersailor/express-openapi-decorators';
import { UserController } from './src/user.controller.js';

export default {
  openapi: '3.1.0',
  title: 'Basic Example API',
  version: '1.0.0',
  description: 'Minimal CRUD example using express-openapi-decorators',
  servers: [{ url: 'http://localhost:3000', description: 'Local' }],
  // You can list controllers explicitly:
  controllers: [UserController],
  // Or use auto-discovery:
  // controllers: await loadControllers('src/**/*.controller.ts'),
};
