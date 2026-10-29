import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AppStorageService } from './storage.service';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('storage')
export class StorageController {
  constructor(private storageService: AppStorageService) {}

  @Post('upload')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (video)
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No file provided');
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `evidence/${crypto.randomUUID()}${ext}`;
    const result = await this.storageService.uploadFile(key, file.buffer, file.mimetype);
    return {
      success: true,
      storageKey: result.storageKey,
      size: result.size,
      sha256: result.sha256,
      mime: file.mimetype,
    };
  }

  @Get('file/:key')
  async getLocalFile(
    @Param('key') key: string,
    @Query('expires') expires: string,
    @Query('sig') sig: string,
    @Res() res: Response
  ) {
    // Verify signature and expiration
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const expiresNum = Number(expires);
    if (!expiresNum || Date.now() > expiresNum) {
      throw new UnauthorizedException('Signed file URL has expired');
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${key}:${expires}`)
      .digest('hex');

    if (sig !== expectedSig) {
      throw new UnauthorizedException('Invalid file URL signature');
    }

    const localDir = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || 'uploads');
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(localDir, safeKey);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(fullPath);
  }
}
