import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  Controller,
  Get,
  Post,
  Param,
} from '@developersailor/express-openapi-decorators';
import type { Request, Response } from 'express';
import { UserDto, CreateUserDto } from './dto.js';

@ApiTags('Users')
@Controller('/users')
export class UserController {
  @Get('/')
  @ApiOperation({ summary: 'List users', operationId: 'listUsers' })
  @ApiResponse({ status: 200, description: 'A page of users', type: [UserDto] })
  list(_req: Request, res: Response): void {
    res.json({ users: [] });
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a user by id', operationId: 'getUser' })
  @ApiResponse({ status: 200, description: 'The user', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  get(@Param('id') id: string, res: Response): void {
    res.status(200).json({ id });
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new user', operationId: 'createUser' })
  @ApiBody(CreateUserDto)
  @ApiResponse({ status: 201, description: 'User created', type: UserDto })
  create(req: Request, res: Response): void {
    res.status(201).json({ id: 'new', ...req.body });
  }
}
