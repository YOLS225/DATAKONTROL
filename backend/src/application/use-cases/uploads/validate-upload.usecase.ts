import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type {
  SchemaColumn,
  SchemaDefinition,
} from "../../../domain/entities/schema.entity.js";
import {
  UploadStatus,
  type Upload,
} from "../../../domain/entities/upload.entity.js";
import { ValidationErrorEntity } from "../../../domain/entities/validation-error.entity.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";
import type { ValidationErrorRepository } from "../../../domain/ports/repositories/validation-error.repository.js";
import type {
  FileParser,
  ParsedRow,
} from "../../../domain/ports/services/file-parser.js";
import type { FileStorage } from "../../../domain/ports/services/file-storage.js";

const ERROR_BATCH_SIZE = 500;

export class ValidateUploadUseCase {
  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly schemaRepository: SchemaVersionRepository,
    private readonly validationErrorRepository: ValidationErrorRepository,
    private readonly fileStorage: FileStorage,
    private readonly fileParser: FileParser,
  ) {}

  async execute(uploadId: string): Promise<void> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload) {
      throw new NotFoundError("Upload", uploadId);
    }
    if (
      upload.status === UploadStatus.COMPLETED ||
      upload.status === UploadStatus.FAILED
    ) {
      return;
    }

    await this.claimUpload(upload);

    const schema = await this.schemaRepository.findById(upload.schemaVersionId);
    if (!schema || schema.sourceId !== upload.sourceId) {
      throw new NotFoundError("Schema version", upload.schemaVersionId);
    }

    await this.validationErrorRepository.deleteByUploadId(upload.id);
    const stream = await this.fileStorage.read(upload.filePath);

    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let headersChecked = false;
    let invalidHeaders = false;
    let errorBatch: ValidationErrorEntity[] = [];

    const flushErrors = async (): Promise<void> => {
      if (errorBatch.length === 0) return;
      await this.validationErrorRepository.saveMany(errorBatch);
      errorBatch = [];
    };

    for await (const row of this.fileParser.parse({
      stream,
      fileName: upload.fileName,
      fileType: upload.fileType,
    })) {
      totalRows += 1;

      if (!headersChecked) {
        const headerErrors = this.validateHeaders(
          upload.id,
          row,
          schema.schemaDefinition,
        );
        invalidHeaders = headerErrors.length > 0;
        errorBatch.push(...headerErrors);
        headersChecked = true;
      }

      const rowErrors = this.validateRow(
        upload.id,
        row,
        schema.schemaDefinition,
      );
      errorBatch.push(...rowErrors);

      if (invalidHeaders || rowErrors.length > 0) {
        invalidRows += 1;
      } else {
        validRows += 1;
      }

      if (errorBatch.length >= ERROR_BATCH_SIZE) {
        await flushErrors();
      }
    }

    await flushErrors();
    const completed = await this.uploadRepository.complete(
      upload.id,
      { totalRows, validRows, invalidRows },
      new Date(),
    );
    if (!completed) {
      throw new ConflictException("Upload can no longer be completed");
    }
  }

  private async claimUpload(upload: Upload): Promise<void> {
    if (upload.status === UploadStatus.PROCESSING) return;
    const claimed = await this.uploadRepository.markProcessing(upload.id);
    if (!claimed) {
      throw new ConflictException("Upload can no longer be processed");
    }
  }

  private validateHeaders(
    uploadId: string,
    row: ParsedRow,
    definition: SchemaDefinition,
  ): ValidationErrorEntity[] {
    const expected = new Set(definition.columns.map((column) => column.name));
    const actual = new Set(Object.keys(row.values));
    const errors: ValidationErrorEntity[] = [];

    for (const column of expected) {
      if (!actual.has(column)) {
        errors.push(
          this.error(
            uploadId,
            1,
            column,
            "MISSING_COLUMN",
            `Required schema column "${column}" is missing from the CSV header`,
          ),
        );
      }
    }
    for (const column of actual) {
      if (!expected.has(column)) {
        errors.push(
          this.error(
            uploadId,
            1,
            column,
            "UNKNOWN_COLUMN",
            `CSV column "${column}" is not defined in the schema`,
          ),
        );
      }
    }
    return errors;
  }

  private validateRow(
    uploadId: string,
    row: ParsedRow,
    definition: SchemaDefinition,
  ): ValidationErrorEntity[] {
    const errors: ValidationErrorEntity[] = [];
    for (const column of definition.columns) {
      if (!(column.name in row.values)) continue;
      const value = row.values[column.name];

      if (column.required && value.length === 0) {
        errors.push(
          this.error(
            uploadId,
            row.rowNumber,
            column.name,
            "REQUIRED",
            `Column "${column.name}" is required`,
            value,
          ),
        );
        continue;
      }
      if (value.length > 0 && !this.hasValidType(value, column)) {
        errors.push(
          this.error(
            uploadId,
            row.rowNumber,
            column.name,
            "INVALID_TYPE",
            `Value must be of type ${column.type}`,
            value,
          ),
        );
      }
    }
    return errors;
  }

  private hasValidType(value: string, column: SchemaColumn): boolean {
    switch (column.type) {
      case "string":
        return true;
      case "integer":
        return /^[+-]?\d+$/.test(value) && Number.isSafeInteger(Number(value));
      case "decimal":
        return Number.isFinite(Number(value));
      case "boolean":
        return ["true", "false", "1", "0", "yes", "no"].includes(
          value.toLowerCase(),
        );
      case "date":
        return this.isIsoDate(value);
      case "datetime":
        return (
          /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value))
        );
    }
  }

  private isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    );
  }

  private error(
    uploadId: string,
    rowNumber: number,
    columnName: string,
    errorType: ValidationErrorEntity["errorType"],
    errorMessage: string,
    value: string | null = null,
  ): ValidationErrorEntity {
    return new ValidationErrorEntity(
      crypto.randomUUID(),
      uploadId,
      rowNumber,
      columnName,
      errorType,
      errorMessage,
      value,
    );
  }
}
