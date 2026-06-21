import { OrderController } from './src/order.controller.js';

export default {
  openapi: '3.1.0',
  title: 'Advanced Example API',
  version: '1.0.0',
  description: 'Kitchen-sink example combining many decorators',
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Orders', description: 'Customer order management' },
  ],
  controllers: [OrderController],
};
