import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiFile,
  Controller,
  Post,
} from '@developersailor/express-openapi-decorators';
import multer from 'multer';
import type { Request, Response } from 'express';

const upload = multer({ storage: multer.memoryStorage() });

@ApiTags('Uploads')
@Controller('/uploads')
export class UploadController {
  @Post('/avatar')
  @ApiOperation({ summary: 'Upload a single avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiFile({ name: 'avatar', required: true, allowedMimeTypes: ['image/jpeg', 'image/png'] })
  @ApiResponse({ status: 201, description: 'File uploaded' })
  uploadAvatar(req: Request, res: Response): void {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    res.status(201).json({ id: 'new', size: file?.size ?? 0 });
  }
}
