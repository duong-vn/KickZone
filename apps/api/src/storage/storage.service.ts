import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly defaultBucket = 'field-images';
  private bucketChecked = false;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  private async ensureBucketExists(): Promise<void> {
    if (this.bucketChecked || !this.supabase) return;

    try {
      const { data: buckets, error: listError } =
        await this.supabase.storage.listBuckets();

      if (listError) {
        this.logger.warn(
          `Could not list storage buckets: ${listError.message}`,
        );
      }

      const exists = buckets?.some((b) => b.name === this.defaultBucket);

      if (!exists) {
        const { error: createError } = await this.supabase.storage.createBucket(
          this.defaultBucket,
          {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/jpg',
            ],
          },
        );

        if (createError && !createError.message.includes('already exists')) {
          this.logger.warn(
            `Could not auto-create bucket "${this.defaultBucket}": ${createError.message}`,
          );
        } else {
          this.logger.log(
            `Supabase Storage bucket "${this.defaultBucket}" is ready (public: true).`,
          );
        }
      }
      this.bucketChecked = true;
    } catch (err) {
      this.logger.warn(
        `Failed to ensure storage bucket: ${(err as Error).message}`,
      );
    }
  }

  async uploadFieldImage(
    file: Express.Multer.File,
    fieldId: string,
  ): Promise<UploadResult> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Supabase Storage is not configured',
      );
    }

    // Ensure bucket exists before upload
    await this.ensureBucketExists();

    // Determine extension
    const originalName = file.originalname || 'image.jpg';
    const ext = originalName.includes('.')
      ? originalName.split('.').pop()
      : 'jpg';
    const filePath = `fields/${fieldId}/${Date.now()}-${randomUUID()}.${ext}`;

    let { error } = await this.supabase.storage
      .from(this.defaultBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    // If bucket was not found, attempt creation and retry once
    if (error && error.message.toLowerCase().includes('not found')) {
      this.logger.log(
        `Bucket "${this.defaultBucket}" not found. Attempting to create and retry upload...`,
      );
      this.bucketChecked = false;
      await this.ensureBucketExists();

      const retryResult = await this.supabase.storage
        .from(this.defaultBucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      error = retryResult.error;
    }

    if (error) {
      this.logger.error(`Storage upload error: ${error.message}`);
      throw new InternalServerErrorException(
        `Lỗi tải lên Supabase Storage: ${error.message}`,
      );
    }

    const { data: urlData } = this.supabase.storage
      .from(this.defaultBucket)
      .getPublicUrl(filePath);

    return {
      storagePath: urlData.publicUrl || filePath,
      publicUrl: urlData.publicUrl || filePath,
    };
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Supabase Storage is not configured',
      );
    }

    await this.ensureBucketExists();

    const originalName = file.originalname || 'avatar.jpg';
    const ext = originalName.includes('.')
      ? originalName.split('.').pop()
      : 'jpg';
    const filePath = `avatars/${userId}/${Date.now()}-${randomUUID()}.${ext}`;

    let { error } = await this.supabase.storage
      .from(this.defaultBucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error && error.message.toLowerCase().includes('not found')) {
      this.bucketChecked = false;
      await this.ensureBucketExists();
      const retryResult = await this.supabase.storage
        .from(this.defaultBucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      error = retryResult.error;
    }

    if (error) {
      this.logger.error(`Storage avatar upload error: ${error.message}`);
      throw new InternalServerErrorException(
        `Lỗi tải lên avatar: ${error.message}`,
      );
    }

    const { data: urlData } = this.supabase.storage
      .from(this.defaultBucket)
      .getPublicUrl(filePath);

    return {
      storagePath: urlData.publicUrl || filePath,
      publicUrl: urlData.publicUrl || filePath,
    };
  }
}
