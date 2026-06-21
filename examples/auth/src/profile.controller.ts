import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  Controller,
  Get,
  Use,
} from '@developersailor/express-openapi-decorators';
import type { Request, Response } from 'express';
import { bearerAuth } from './auth.middleware.js';

@ApiBearerAuth('bearer', { bearerFormat: 'JWT' })
@ApiTags('Profile')
@Controller('/profile')
@Use(bearerAuth)
export class ProfileController {
  @Get('/')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'The profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(req: Request, res: Response): void {
    const user = (req as Request & { user?: { id: string } }).user;
    res.json({ id: user?.id ?? 'unknown' });
  }
}
