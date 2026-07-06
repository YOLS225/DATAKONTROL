import { Readable } from "node:stream";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload as S3Upload } from "@aws-sdk/lib-storage";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  FileStorage,
  SaveFileInput,
} from "../../domain/ports/services/file-storage.js";

@Injectable()
export class S3FileStorage
  implements FileStorage, OnModuleInit, OnModuleDestroy
{
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>("S3_BUCKET");
    this.client = new S3Client({
      endpoint: config.getOrThrow<string>("S3_ENDPOINT"),
      region: config.get<string>("S3_REGION") ?? "us-east-1",
      forcePathStyle: config.get<string>("S3_FORCE_PATH_STYLE") !== "false",
      credentials: {
        accessKeyId: config.getOrThrow<string>("S3_ACCESS_KEY"),
        secretAccessKey: config.getOrThrow<string>("S3_SECRET_KEY"),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (!this.isNotFound(error)) throw error;
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async save(input: SaveFileInput): Promise<void> {
    const upload = new S3Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: input.key,
        Body: input.stream,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
      },
      leavePartsOnError: false,
    });
    await upload.done();
  }

  async read(key: string): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!(response.Body instanceof Readable)) {
      throw new Error(
        `Stored object "${key}" does not expose a Node.js stream`,
      );
    }
    return response.Body;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }

  private isNotFound(error: unknown): boolean {
    if (typeof error !== "object" || error === null) return false;
    const candidate = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };
    return (
      candidate.name === "NotFound" ||
      candidate.name === "NoSuchBucket" ||
      candidate.$metadata?.httpStatusCode === 404
    );
  }
}
