import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "bullmq";
import type { Job } from "bullmq";
import type { ValidateUploadUseCase } from "../../application/use-cases/uploads/validate-upload.usecase.js";
import type { UploadRepository } from "../../domain/ports/repositories/upload.repository.js";
import {
  UPLOAD_QUEUE_NAME,
  VALIDATE_UPLOAD_JOB,
  type ValidateUploadJobData,
} from "../queue/bullmq-upload-queue.js";

@Injectable()
export class BullMqUploadWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BullMqUploadWorker.name);
  private worker?: Worker<
    ValidateUploadJobData,
    void,
    typeof VALIDATE_UPLOAD_JOB
  >;

  constructor(
    private readonly config: ConfigService,
    private readonly validateUpload: ValidateUploadUseCase,
    private readonly uploadRepository: UploadRepository,
  ) {}

  onModuleInit(): void {
    const password = this.config.get<string>("REDIS_PASSWORD");
    this.worker = new Worker(UPLOAD_QUEUE_NAME, (job) => this.process(job), {
      connection: {
        host: this.config.get<string>("REDIS_HOST") ?? "localhost",
        port: Number(this.config.get<string>("REDIS_PORT") ?? 6379),
        ...(password ? { password } : {}),
        maxRetriesPerRequest: null,
      },
      concurrency: Number(
        this.config.get<string>("UPLOAD_WORKER_CONCURRENCY") ?? 2,
      ),
    });
    this.worker.on("error", (error) => {
      this.logger.error("Upload worker error", error.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async process(
    job: Job<ValidateUploadJobData, void, typeof VALIDATE_UPLOAD_JOB>,
  ): Promise<void> {
    try {
      await this.validateUpload.execute(job.data.uploadId);
    } catch (error) {
      const attempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade + 1 >= attempts;
      if (isLastAttempt) {
        try {
          await this.uploadRepository.fail(job.data.uploadId, new Date());
        } catch (markFailedError) {
          this.logger.error(
            `Could not mark upload ${job.data.uploadId} as failed`,
            markFailedError instanceof Error
              ? markFailedError.stack
              : undefined,
          );
        }
      }
      throw error;
    }
  }
}
