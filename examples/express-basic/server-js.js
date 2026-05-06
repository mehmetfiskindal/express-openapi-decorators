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
} = require('../dist/index.js');

// ============================================
// DTO Classes
// ============================================

class UserDto {
  static id = {
    type: String,
    example: 'user_123',
    description: 'Unique user identifier',
  };
  
  static name = {
    type: String,
    example: 'Mehmet',
    description: 'User name',
  };
  
  static email = {
    type: String,
    format: 'email',
    example: 'mehmet@example.com',
    description: 'User email address',
  };
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
    description: 'Returns a paginated list of all users',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  listUsers(req, res) {
    res.json({ users: [] });
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
  health(req, res) {
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

// Actual routes
const userController = new UserController();
const healthController = new HealthController();

app.get('/health', (req, res) => healthController.health(req, res));
app.get('/users', (req, res) => userController.listUsers(req, res));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
  console.log(`OpenAPI JSON available at http://localhost:${PORT}/api-docs.json`);
});

// Export for testing
module.exports = { app, openApiDocument };
