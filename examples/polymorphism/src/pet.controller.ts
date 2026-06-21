import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
  Controller,
  Get,
  Post,
  ApiBody,
} from '@developersailor/express-openapi-decorators';
import type { Request, Response } from 'express';
import { Cat, Dog } from './animals.js';

class PetEnvelope {
  @ApiProperty({
    oneOf: [Cat, Dog],
    discriminator: { propertyName: 'kind' },
  })
  pet!: Cat | Dog;
}

@ApiTags('Pets')
@Controller('/pets')
export class PetController {
  @Get('/')
  @ApiOperation({ summary: 'List all pets' })
  @ApiResponse({ status: 200, description: 'A list of pets' })
  list(_req: Request, res: Response): void {
    res.json({ pets: [] });
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a pet' })
  @ApiBody(PetEnvelope)
  @ApiResponse({ status: 201, description: 'Pet created' })
  create(req: Request, res: Response): void {
    res.status(201).json({ id: 'new', ...req.body });
  }
}
