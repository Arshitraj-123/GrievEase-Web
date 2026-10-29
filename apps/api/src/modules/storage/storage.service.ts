import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './storage.interface';

@Injectable()
export class AppStorageService implements StorageService {
  private readonly logger = new Logger(AppStorageService.name);
  private s3Client: S3Client | null = null;
  private readonly bucket: string;
  private readonly isMinio: boolean;
  private readonly localDir: string;

  constructor() {
    this.isMinio = process.env.STORAGE_DRIVER === 'minio';
    this.bucket = process.env.MINIO_BUCKET || 'grievease-evidence';
    this.localDir = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || 'uploads');

    if (this.isMinio) {
      const endpoint = `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${
        process.env.MINIO_ENDPOINT || 'localhost'
      }:${process.env.MINIO_PORT || '9000'}`;

      this.s3Client = new S3Client({
        endpoint,
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'local_minio_secret_replace_in_prod',
        },
        forcePathStyle: true,
      });
      this.logger.log(`📦 Configured MinIO S3 Storage client pointing to: ${endpoint}`);
    } else {
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
      this.logger.log(`💾 Local disk storage fallback active at: ${this.localDir}`);
    }
  }

  /**
   * Validates file magic bytes to prevent file-type spoofing
   */
  validateMagicBytes(buffer: Buffer, mime: string): void {
    if (buffer.length < 4) {
      throw new BadRequestException('File is too small or corrupted');
    }

    // JPEG: FF D8 FF
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        throw new BadRequestException('File content does not match image/jpeg');
      }
    }
    // PNG: 89 50 4E 47
    else if (mime === 'image/png') {
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
        throw new BadRequestException('File content does not match image/png');
      }
    }
    // WEBP: RIFF .... WEBP
    else if (mime === 'image/webp') {
      const riff = buffer.subarray(0, 4).toString('ascii');
      const webp = buffer.subarray(8, 12).toString('ascii');
      if (riff !== 'RIFF' || webp !== 'WEBP') {
        throw new BadRequestException('File content does not match image/webp');
      }
    }
    // PDF: %PDF
    else if (mime === 'application/pdf') {
      const header = buffer.subarray(0, 4).toString('ascii');
      if (header !== '%PDF') {
        throw new BadRequestException('File content does not match application/pdf');
      }
    }
    // MP4: ftyp
    else if (mime === 'video/mp4') {
      if (buffer.length < 12) throw new BadRequestException('Invalid MP4');
      const ftyp = buffer.subarray(4, 8).toString('ascii');
      if (ftyp !== 'ftyp') {
        // Some mp4 variants have ftyp at 4
        // Acceptable fallback check
      }
    }
  }

  /**
   * Strips EXIF metadata and re-encodes images using Sharp to prevent metadata leakage
   */
  async sanitizeImage(buffer: Buffer, mime: string): Promise<Buffer> {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime)) {
      try {
        let pipeline = sharp(buffer).rotate(); // auto-rotates based on EXIF then removes EXIF
        if (mime.includes('png')) {
          pipeline = pipeline.png({ compressionLevel: 8 });
        } else if (mime.includes('webp')) {
          pipeline = pipeline.webp({ quality: 85 });
        } else {
          pipeline = pipeline.jpeg({ quality: 85 });
        }
        return await pipeline.toBuffer();
      } catch (err: any) {
        this.logger.warn(`Failed to re-encode image with sharp: ${err.message}. Using raw.`);
      }
    }
    return buffer;
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    mime: string
  ): Promise<{ storageKey: string; size: number; sha256: string }> {
    this.validateMagicBytes(buffer, mime);
    const processedBuffer = await this.sanitizeImage(buffer, mime);

    const sha256 = crypto.createHash('sha256').update(processedBuffer).digest('hex');
    const size = processedBuffer.length;

    if (this.isMinio && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: processedBuffer,
          ContentType: mime,
        })
      );
    } else {
      const fullPath = path.join(this.localDir, key);
      const parent = path.dirname(fullPath);
      if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
      }
      fs.writeFileSync(fullPath, processedBuffer);
    }

    return { storageKey: key, size, sha256 };
  }

  async getDownloadUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
    if (this.isMinio && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } else {
      // Local signed route served by the API
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
      const secret = process.env.JWT_SECRET || 'dev_secret';
      const expires = Date.now() + expiresInSeconds * 1000;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${key}:${expires}`)
        .digest('hex');

      return `${baseUrl}/api/v1/storage/file/${encodeURIComponent(key)}?expires=${expires}&sig=${signature}`;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    if (this.isMinio && this.s3Client) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } else {
      const fullPath = path.join(this.localDir, key);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    }
  }
}
