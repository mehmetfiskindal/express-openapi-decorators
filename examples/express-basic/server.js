// JavaScript Example - uses the built library
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  createOpenApiDocument,
} = require('../../dist/index.js');

// ============================================
// DTO Classes
// ============================================

class UserDto {}
ApiProperty({
  type: String,
  example: 'user_123',
  description: 'Unique user identifier',
})(UserDto.prototype, 'id');

ApiProperty({
  type: String,
  example: 'Mehmet',
  description: 'User name',
})(UserDto.prototype, 'name');

ApiProperty({
  type: String,
  format: 'email',
  example: 'mehmet@example.com',
  description: 'User email address',
})(UserDto.prototype, 'email');

ApiPropertyOptional({
  type: Number,
  example: 25,
  description: 'User age',
})(UserDto.prototype, 'age');

ApiProperty({
  enum: ['active', 'inactive', 'suspended'],
  example: 'active',
  description: 'User account status',
})(UserDto.prototype, 'status');

ApiProperty({
  type: [String],
  example: ['admin', 'user'],
  description: 'User roles',
})(UserDto.prototype, 'roles');

class CreateUserDto {}
ApiProperty({
  type: String,
  example: 'Mehmet',
  description: 'User name',
  required: true,
})(CreateUserDto.prototype, 'name');

ApiProperty({
  type: String,
  format: 'email',
  example: 'mehmet@example.com',
  description: 'User email address',
  required: true,
})(CreateUserDto.prototype, 'email');

ApiPropertyOptional({
  type: Number,
  example: 25,
  description: 'User age',
})(CreateUserDto.prototype, 'age');

class UpdateUserDto {}
ApiPropertyOptional({
  type: String,
  example: 'Mehmet',
  description: 'User name',
})(UpdateUserDto.prototype, 'name');

ApiPropertyOptional({
  type: String,
  format: 'email',
  example: 'mehmet@example.com',
  description: 'User email address',
})(UpdateUserDto.prototype, 'email');

ApiPropertyOptional({
  enum: ['active', 'inactive', 'suspended'],
  example: 'active',
  description: 'User account status',
})(UpdateUserDto.prototype, 'status');

class ErrorDto {}
ApiProperty({
  type: Number,
  example: 400,
  description: 'HTTP status code',
})(ErrorDto.prototype, 'statusCode');

ApiProperty({
  type: String,
  example: 'Bad Request',
  description: 'Error message',
})(ErrorDto.prototype, 'message');

ApiPropertyOptional({
  type: String,
  example: 'VALIDATION_ERROR',
  description: 'Error code',
})(ErrorDto.prototype, 'code');

// ============================================
// Controllers
// ============================================

@ApiTags('Users')
@Controller('/users')
class UserController {
  listUsers(req, res) {
    res.json({ users: [] });
  }

  getUser(req, res) {
    res.json({ id: req.params.id });
  }

  createUser(req, res) {
    res.status(201).json({ id: 'new_user_123' });
  }

  updateUser(req, res) {
    res.json({ id: req.params.id });
  }

  deleteUser(req, res) {
    res.status(204).send();
  }
}

// Apply decorators manually for methods
ApiOperation({
  summary: 'List all users',
  description: 'Returns a paginated list of all users in the system',
})(UserController.prototype, 'listUsers');

ApiQuery({
  name: 'page',
  type: Number,
  required: false,
  example: 1,
  description: 'Page number (default: 1)',
})(UserController.prototype, 'listUsers');

ApiQuery({
  name: 'limit',
  type: Number,
  required: false,
  example: 10,
  description: 'Number of items per page (default: 10)',
})(UserController.prototype, 'listUsers');

ApiQuery({
  name: 'status',
  type: String,
  required: false,
  example: 'active',
  description: 'Filter by user status',
})(UserController.prototype, 'listUsers');

ApiResponse({
  status: 200,
  description: 'List of users retrieved successfully',
  type: [UserDto],
})(UserController.prototype, 'listUsers');

ApiResponse({
  status: 401,
  description: 'Unauthorized - Authentication required',
  type: ErrorDto,
})(UserController.prototype, 'listUsers');

Get('/')(UserController.prototype, 'listUsers');

ApiOperation({
  summary: 'Get user by ID',
  description: 'Returns detailed information about a specific user',
})(UserController.prototype, 'getUser');

ApiParam({
  name: 'id',
  type: String,
  required: true,
  example: 'user_123',
  description: 'User unique identifier',
})(UserController.prototype, 'getUser');

ApiResponse({
  status: 200,
  description: 'User found',
  type: UserDto,
})(UserController.prototype, 'getUser');

ApiResponse({
  status: 404,
  description: 'User not found',
  type: ErrorDto,
})(UserController.prototype, 'getUser');

Get('/:id')(UserController.prototype, 'getUser');

ApiOperation({
  summary: 'Create new user',
  description: 'Creates a new user account with the provided information',
})(UserController.prototype, 'createUser');

ApiBody(CreateUserDto)(UserController.prototype, 'createUser');

ApiResponse({
  status: 201,
  description: 'User created successfully',
  type: UserDto,
})(UserController.prototype, 'createUser');

ApiResponse({
  status: 400,
  description: 'Invalid input data',
  type: ErrorDto,
})(UserController.prototype, 'createUser');

ApiResponse({
  status: 409,
  description: 'User with this email already exists',
  type: ErrorDto,
})(UserController.prototype, 'createUser');

Post('/')(UserController.prototype, 'createUser');

ApiOperation({
  summary: 'Update user',
  description: 'Updates all fields of an existing user',
})(UserController.prototype, 'updateUser');

ApiParam({
  name: 'id',
  type: String,
  required: true,
  example: 'user_123',
  description: 'User unique identifier',
})(UserController.prototype, 'updateUser');

ApiBody(UpdateUserDto)(UserController.prototype, 'updateUser');

ApiResponse({
  status: 200,
  description: 'User updated successfully',
  type: UserDto,
})(UserController.prototype, 'updateUser');

ApiResponse({
  status: 404,
  description: 'User not found',
  type: ErrorDto,
})(UserController.prototype, 'updateUser');

Put('/:id')(UserController.prototype, 'updateUser');

ApiOperation({
  summary: 'Delete user',
  description: 'Permanently removes a user from the system',
})(UserController.prototype, 'deleteUser');

ApiParam({
  name: 'id',
  type: String,
  required: true,
  example: 'user_123',
  description: 'User unique identifier',
})(UserController.prototype, 'deleteUser');

ApiResponse({
  status: 204,
  description: 'User deleted successfully',
})(UserController.prototype, 'deleteUser');

ApiResponse({
  status: 404,
  description: 'User not found',
  type: ErrorDto,
})(UserController.prototype, 'deleteUser');

Delete('/:id')(UserController.prototype, 'deleteUser');

@ApiTags('Health')
@Controller('/health')
class HealthController {
  health(req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
}

ApiOperation({
  summary: 'Health check',
  description: 'Returns the health status of the API',
})(HealthController.prototype, 'health');

ApiResponse({
  status: 200,
  description: 'API is healthy',
})(HealthController.prototype, 'health');

Get('/')(HealthController.prototype, 'health');

// ============================================
// Express Application Setup
// ============================================

const app = express();
app.use(express.json());

// Create OpenAPI document
const openApiDocument = createOpenApiDocument({
  title: 'Express OpenAPI Decorators Demo API',
  description: 'A demo API showcasing express-openapi-decorators capabilities',
  version: '1.0.0',
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  controllers: [UserController, HealthController],
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// JSON endpoint for OpenAPI spec
app.get('/api-docs.json', (req, res) => {
  res.json(openApiDocument);
});

// Actual routes
const userController = new UserController();
const healthController = new HealthController();

// Health routes
app.get('/health', (req, res) => healthController.health(req, res));

// User routes
app.get('/users', (req, res) => userController.listUsers(req, res));
app.get('/users/:id', (req, res) => userController.getUser(req, res));
app.post('/users', (req, res) => userController.createUser(req, res));
app.put('/users/:id', (req, res) => userController.updateUser(req, res));
app.delete('/users/:id', (req, res) => userController.deleteUser(req, res));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
  console.log(`OpenAPI JSON available at http://localhost:${PORT}/api-docs.json`);
});

module.exports = { app, openApiDocument };
