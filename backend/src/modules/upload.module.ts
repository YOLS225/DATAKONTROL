import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SaveFileUseCase } from "../application/use-cases/uploads/save-file.usecase.js";
import { ValidateUploadUseCase } from "../application/use-cases/uploads/validate-upload.usecase.js";
import { GetUploadUseCase } from "../application/use-cases/uploads/get-upload.usecase.js";
import { GetUploadsUseCase } from "../application/use-cases/uploads/get-uploads.usecase.js";
import { GetValidationErrorsUseCase } from "../application/use-cases/uploads/get-validation-errors.usecase.js";
import {
  SCHEMA_VERSION_REPOSITORY,
  type SchemaVersionRepository,
} from "../domain/ports/repositories/schema.repository.js";
import {
  SOURCE_REPOSITORY,
  type SourceRepository,
} from "../domain/ports/repositories/source.repository.js";
import {
  UPLOAD_REPOSITORY,
  type UploadRepository,
} from "../domain/ports/repositories/upload.repository.js";
import {
  VALIDATION_ERROR_REPOSITORY,
  type ValidationErrorRepository,
} from "../domain/ports/repositories/validation-error.repository.js";
import {
  FILE_PARSER,
  type FileParser,
} from "../domain/ports/services/file-parser.js";
import {
  FILE_STORAGE,
  type FileStorage,
} from "../domain/ports/services/file-storage.js";
import {
  UPLOAD_QUEUE,
  type UploadQueue,
} from "../domain/ports/services/upload-queue.js";
import { PrismaUploadRepository } from "../infrastructure/persistence/repositories/upload.repository.js";
import { PrismaValidationErrorRepository } from "../infrastructure/persistence/repositories/validation-error.repository.js";
import { CsvFileParser } from "../infrastructure/parsers/csv-file.parser.js";
import { ExcelFileParser } from "../infrastructure/parsers/excel-file.parser.js";
import { SpreadsheetFileParser } from "../infrastructure/parsers/spreadsheet-file.parser.js";
import { BullMqUploadQueue } from "../infrastructure/queue/bullmq-upload-queue.js";
import { S3FileStorage } from "../infrastructure/storage/minio.adapter.js";
import { BullMqUploadWorker } from "../infrastructure/workers/bullmq-upload.worker.js";
import { UploadController } from "../presentation/controllers/upload.controller.js";
import { SchemaModule } from "./schema.module.js";
import { SourceModule } from "./source.module.js";
import { UserModule } from "./user.module.js";

@Module({
  imports: [UserModule, SourceModule, SchemaModule],
  controllers: [UploadController],
  providers: [
    {
      provide: UPLOAD_REPOSITORY,
      useClass: PrismaUploadRepository,
    },
    {
      provide: FILE_STORAGE,
      useClass: S3FileStorage,
    },
    {
      provide: FILE_PARSER,
      inject: [CsvFileParser, ExcelFileParser],
      useFactory: (csv: CsvFileParser, excel: ExcelFileParser) =>
        new SpreadsheetFileParser(csv, excel),
    },
    CsvFileParser,
    ExcelFileParser,
    {
      provide: VALIDATION_ERROR_REPOSITORY,
      useClass: PrismaValidationErrorRepository,
    },
    {
      provide: UPLOAD_QUEUE,
      useClass: BullMqUploadQueue,
    },
    {
      provide: SaveFileUseCase,
      inject: [
        SOURCE_REPOSITORY,
        SCHEMA_VERSION_REPOSITORY,
        UPLOAD_REPOSITORY,
        FILE_STORAGE,
        UPLOAD_QUEUE,
      ],
      useFactory: (
        sources: SourceRepository,
        schemas: SchemaVersionRepository,
        uploads: UploadRepository,
        storage: FileStorage,
        queue: UploadQueue,
      ) => new SaveFileUseCase(sources, schemas, uploads, storage, queue),
    },
    {
      provide: ValidateUploadUseCase,
      inject: [
        UPLOAD_REPOSITORY,
        SCHEMA_VERSION_REPOSITORY,
        VALIDATION_ERROR_REPOSITORY,
        FILE_STORAGE,
        FILE_PARSER,
      ],
      useFactory: (
        uploads: UploadRepository,
        schemas: SchemaVersionRepository,
        errors: ValidationErrorRepository,
        storage: FileStorage,
        parser: FileParser,
      ) => new ValidateUploadUseCase(uploads, schemas, errors, storage, parser),
    },
    {
      provide: GetUploadsUseCase,
      inject: [SOURCE_REPOSITORY, UPLOAD_REPOSITORY],
      useFactory: (sources: SourceRepository, uploads: UploadRepository) =>
        new GetUploadsUseCase(sources, uploads),
    },
    {
      provide: GetUploadUseCase,
      inject: [SOURCE_REPOSITORY, UPLOAD_REPOSITORY],
      useFactory: (sources: SourceRepository, uploads: UploadRepository) =>
        new GetUploadUseCase(sources, uploads),
    },
    {
      provide: GetValidationErrorsUseCase,
      inject: [
        SOURCE_REPOSITORY,
        UPLOAD_REPOSITORY,
        VALIDATION_ERROR_REPOSITORY,
      ],
      useFactory: (
        sources: SourceRepository,
        uploads: UploadRepository,
        errors: ValidationErrorRepository,
      ) => new GetValidationErrorsUseCase(sources, uploads, errors),
    },
    {
      provide: BullMqUploadWorker,
      inject: [ConfigService, ValidateUploadUseCase, UPLOAD_REPOSITORY],
      useFactory: (
        config: ConfigService,
        validateUpload: ValidateUploadUseCase,
        uploads: UploadRepository,
      ) => new BullMqUploadWorker(config, validateUpload, uploads),
    },
  ],
})
export class UploadModule {}
