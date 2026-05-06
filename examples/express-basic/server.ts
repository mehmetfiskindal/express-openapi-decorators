import 'reflect-metadata';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import {
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
} from '../../dist/index.mjs';

// ============================================
// DTO Classes
// ============================================

class UserDto {
  @ApiProperty({
    type: String,
    example: 'user_123',
    description: 'Unique user identifier',
  })
  id!: string;

  @ApiProperty({
    type: String,
    example: 'Mehmet',
    description: 'User name',
  })
  name!: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'mehmet@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiPropertyOptional({
    type: Number,
    example: 25,
    description: 'User age',
  })
  age?: number;

  @ApiProperty({
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
    description: 'User account status',
  })
  status!: 'active' | 'inactive' | 'suspended';

  @ApiProperty({
    type: [String],
    example: ['admin', 'user'],
    description: 'User roles',
  })
  roles!: string[];
}

class CreateUserDto {
  @ApiProperty({
    type: String,
    example: 'Mehmet',
    description: 'User name',
    required: true,
  })
  name!: string;

  @ApiProperty({
    type: String,
    format: 'email',
    example: 'mehmet@example.com',
    description: 'User email address',
    required: true,
  })
  email!: string;

  @ApiPropertyOptional({
    type: Number,
    example: 25,
    description: 'User age',
  })
  age?: number;
}

class UpdateUserDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Mehmet',
    description: 'User name',
  })
  name?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'email',
    example: 'mehmet@example.com',
    description: 'User email address',
  })
  email?: string;

  @ApiPropertyOptional({
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
    description: 'User account status',
  })
  status?: 'active' | 'inactive' | 'suspended';
}

class ErrorDto {
  @ApiProperty({
    type: Number,
    example: 400,
    description: 'HTTP status code',
  })
  statusCode!: number;

  @ApiProperty({
    type: String,
    example: 'Bad Request',
    description: 'Error message',
  })
  message!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'VALIDATION_ERROR',
    description: 'Error code',
  })
  code?: string;
}

// ============================================
// Controllers
// ============================================

@ApiTags('Users')
@Controller('/users')
class UserController {
  @Get('/')
  @ApiOperation({
    summary: 'List all users',
    description: 'Returns a paginated list of all users in the system',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    example: 10,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false,
    example: 'active',
    description: 'Filter by user status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    type: [UserDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorDto,
  })
  listUsers(req: express.Request, res: express.Response) {
    // Implementation
    res.json({ users: [] });
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns detailed information about a specific user',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: 'user_123',
    description: 'User unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorDto,
  })
  getUser(req: express.Request, res: express.Response) {
    // Implementation
    res.json({ id: req.params.id });
  }

  @Post('/')
  @ApiOperation({
    summary: 'Create new user',
    description: 'Creates a new user account with the provided information',
  })
  @ApiBody(CreateUserDto)
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: ErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
    type: ErrorDto,
  })
  createUser(req: express.Request, res: express.Response) {
    // Implementation
    res.status(201).json({ id: 'new_user_123' });
  }

  @Put('/:id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates all fields of an existing user',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: 'user_123',
    description: 'User unique identifier',
  })
  @ApiBody(UpdateUserDto)
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorDto,
  })
  updateUser(req: express.Request, res: express.Response) {
    // Implementation
    res.json({ id: req.params.id });
  }

  @Delete('/:id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently removes a user from the system',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: 'user_123',
    description: 'User unique identifier',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorDto,
  })
  deleteUser(req: express.Request, res: express.Response) {
    // Implementation
    res.status(204).send();
  }
}

@ApiTags('Health')
@Controller('/health')
class HealthController {
  @Get('/')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the API',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
  })
  health(req: express.Request, res: express.Response) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
}

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

// Actual routes (manual for now - route registration V2'de gelecek)
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
const PORT = process.env['PORT'] ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
  console.log(`OpenAPI JSON available at http://localhost:${PORT}/api-docs.json`);
});
