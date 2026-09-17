import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  Controller,
  Get,
  Post,
  Param,
  Query,
} from 'openapi-decorators';
import { UserDto, CreateUserDto } from './dto.js';

@ApiTags('Users')
@Controller('/users')
export class UserController {
  @Get('/')
  @ApiOperation({ summary: 'List users', operationId: 'listUsers' })
  @ApiResponse({ status: 200, description: 'A page of users', type: [UserDto] })
  list(@Query('limit') limit?: string): { users: UserDto[]; limit?: string } {
    return {
      users: [
        {
          id: 'usr_1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          department: 'Engineering',
        },
      ],
      limit,
    };
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a user by ID', operationId: 'getUser' })
  @ApiResponse({ status: 200, description: 'The user', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  get(@Param('id') id: string): UserDto {
    return {
      id,
      name: 'Jane Doe',
      email: 'jane@example.com',
      department: 'Engineering',
    };
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new user', operationId: 'createUser' })
  @ApiBody(CreateUserDto)
  @ApiResponse({ status: 201, description: 'User created', type: UserDto })
  create(@Param() _params: unknown, @Query() _query: unknown): { id: string } {
    return { id: 'usr_created' };
  }
}
