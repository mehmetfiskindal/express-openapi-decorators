import { ProfileController } from './src/profile.controller.js';

export default {
  openapi: '3.1.0',
  title: 'Auth Example API',
  version: '1.0.0',
  description: 'Bearer-token authentication example',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [ProfileController],
};
