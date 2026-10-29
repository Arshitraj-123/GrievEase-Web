export interface StorageService {
  uploadFile(key: string, buffer: Buffer, mime: string): Promise<{ storageKey: string; size: number; sha256: string }>;
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<boolean>;
}
