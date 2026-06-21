import { PetController } from './src/pet.controller.js';

export default {
  openapi: '3.1.0',
  title: 'Polymorphism Example API',
  version: '1.0.0',
  description: 'Demonstrates oneOf + discriminator',
  servers: [{ url: 'http://localhost:3000' }],
  controllers: [PetController],
};
