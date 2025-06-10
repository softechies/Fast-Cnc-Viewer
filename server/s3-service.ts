import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import path from 'path';

interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

class S3Service {
  private s3Client!: S3Client;
  private bucketName!: string;
  private initialized: boolean = false;

  constructor() {
    // Inicjalizacja zostanie wykonana w initialize()
  }

  initialize(config: S3Config): void {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucketName = config.bucketName;
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('S3Service not initialized. Call initialize() first.');
    }
  }

  /**
   * Przesyła plik do S3 z ścieżki
   */
  async uploadFile(
    filePath: string,
    s3Key: string,
    contentType?: string
  ): Promise<string> {
    this.ensureInitialized();

    try {
      const fileStream = createReadStream(filePath);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentType: contentType || 'application/octet-stream',
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);
      return s3Key;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Przesyła buffer do S3
   */
  async uploadBuffer(
    s3Key: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<string> {
    this.ensureInitialized();

    try {
      console.log('Uploading buffer to S3:', s3Key, buffer.length, contentType);
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);
      return s3Key;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Tworzy podpisany URL do pobierania pliku
   */
  async getSignedDownloadUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Usuwa plik z S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    this.ensureInitialized();

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Generuje klucz S3 na podstawie typu pliku i ID użytkownika
   */
  generateS3Key(userId: number, filename: string, fileType: 'step' | 'stl' | 'dxf'): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${fileType}/${userId}/${timestamp}_${sanitizedFilename}`;
  }

  /**
   * Sprawdza czy serwis jest zainicjalizowany
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Eksportujemy singleton
export const s3Service = new S3Service();

/**
 * Inicjalizuje serwis S3 z konfiguracją ze zmiennych środowiskowych
 */
export function initializeS3Service(): boolean {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = "viewer-fastcnc"||process.env.AWS_S3_BUCKET_NAME  as string;
  const region = process.env.AWS_REGION || 'us-east-1';
  console.log('AWS',{ accessKeyId, secretAccessKey, bucketName, region });

  // Sprawdź czy wszystkie wymagane zmienne są ustawione
  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.warn('S3 service not initialized: missing required environment variables');
    console.warn('Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME');
    return false;
  }

  try {
    s3Service.initialize({
      region,
      accessKeyId,
      secretAccessKey,
      bucketName,
    });
    console.log('S3 service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize S3 service:', error);
    return false;
  }
}