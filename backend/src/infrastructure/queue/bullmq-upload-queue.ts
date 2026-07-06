import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import type { UploadQueue } from "../../domain/ports/services/upload-queue.js";

export const UPLOAD_QUEUE_NAME = "upload-validation";
export const VALIDATE_UPLOAD_JOB = "validate-upload";

export interface ValidateUploadJobData {
  uploadId: string;
}

@Injectable()
export class BullMqUploadQueue implements UploadQueue, OnModuleDestroy {
  private readonly queue: Queue<
    ValidateUploadJobData,
    void,
    typeof VALIDATE_UPLOAD_JOB
  >;

  constructor(config: ConfigService) {
    const password = config.get<string>("REDIS_PASSWORD");
    this.queue = new Queue(UPLOAD_QUEUE_NAME, {
      connection: {
        host: config.get<string>("REDIS_HOST") ?? "localhost",
        port: Number(config.get<string>("REDIS_PORT") ?? 6379),
        ...(password ? { password } : {}),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
      },
    });
  }

  async enqueue(uploadId: string): Promise<void> {
    await this.queue.add(
      VALIDATE_UPLOAD_JOB,
      { uploadId },
      { jobId: uploadId },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
