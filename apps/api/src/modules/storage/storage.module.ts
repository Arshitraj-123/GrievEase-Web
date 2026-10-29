import { Module } from '@nestjs/common';
import { AppStorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [AppStorageService],
  exports: [AppStorageService],
})
export class StorageModule {}
