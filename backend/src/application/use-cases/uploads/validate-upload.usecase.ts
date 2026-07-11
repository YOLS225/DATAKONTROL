import { ConflictException } from "../../../common/exceptions/conflict.js";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type {
  SchemaColumn,
  SchemaDefinition,
  SchemaVersion,
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

interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

interface ValidationState extends ValidationResult {
  headersChecked: boolean;
  invalidHeaders: boolean;
  rowSignatures: Map<string, number>;
  errorBatch: ValidationErrorEntity[];
}

export class ValidateUploadUseCase {
  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly schemaRepository: SchemaVersionRepository,
    private readonly validationErrorRepository: ValidationErrorRepository,
    private readonly fileStorage: FileStorage,
    private readonly fileParser: FileParser,
  ) {}

  async execute(uploadId: string): Promise<void> {
    const upload = await this.getProcessableUpload(uploadId);
    if (!upload) return;

    await this.claimUpload(upload);

    const schema = await this.getUploadSchema(upload);
    await this.prepareValidation(upload);

    const result = await this.validateFile(upload, schema.schemaDefinition);

    await this.completeUpload(upload.id, result);
  }

  private async getProcessableUpload(uploadId: string): Promise<Upload | null> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload) {
      throw new NotFoundError("Upload", uploadId);
    }
    if (
      upload.status === UploadStatus.COMPLETED ||
      upload.status === UploadStatus.FAILED
    ) {
      return null;
    }

    return upload;
  }

  private async getUploadSchema(upload: Upload): Promise<SchemaVersion> {
    const schema = await this.schemaRepository.findById(upload.schemaVersionId);
    if (!schema || schema.sourceId !== upload.sourceId) {
      throw new NotFoundError("Schema version", upload.schemaVersionId);
    }

    return schema;
  }

  private async prepareValidation(upload: Upload): Promise<void> {
    await this.validationErrorRepository.deleteByUploadId(upload.id);
  }

  private async validateFile(
    upload: Upload,
    definition: SchemaDefinition,
  ): Promise<ValidationResult> {
    const stream = await this.fileStorage.read(upload.filePath);
    const state = this.createValidationState();

    for await (const row of this.fileParser.parse({
      stream,
      fileName: upload.fileName,
      fileType: upload.fileType,
    })) {
      this.validateParsedRow(upload.id, row, definition, state);
      await this.flushErrorsIfNeeded(state);
    }

    await this.flushErrors(state);
    return {
      totalRows: state.totalRows,
      validRows: state.validRows,
      invalidRows: state.invalidRows,
    };
  }

  private createValidationState(): ValidationState {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      headersChecked: false,
      invalidHeaders: false,
      rowSignatures: new Map(),
      errorBatch: [],
    };
  }

  private validateParsedRow(
    uploadId: string,
    row: ParsedRow,
    definition: SchemaDefinition,
    state: ValidationState,
  ): void {
    state.totalRows += 1;

    if (!state.headersChecked) {
      const headerErrors = this.validateHeaders(uploadId, row, definition);
      state.invalidHeaders = headerErrors.length > 0;
      state.errorBatch.push(...headerErrors);
      state.headersChecked = true;
    }

    const rowErrors = this.validateRow(uploadId, row, definition);
    rowErrors.push(...this.validateDuplicateRow(uploadId, row, definition, state));
    state.errorBatch.push(...rowErrors);

    if (state.invalidHeaders || rowErrors.length > 0) {
      state.invalidRows += 1;
    } else {
      state.validRows += 1;
    }
  }

  private async flushErrorsIfNeeded(state: ValidationState): Promise<void> {
    if (state.errorBatch.length < ERROR_BATCH_SIZE) return;
    await this.flushErrors(state);
  }

  private async flushErrors(state: ValidationState): Promise<void> {
    if (state.errorBatch.length === 0) return;
    await this.validationErrorRepository.saveMany(state.errorBatch);
    state.errorBatch = [];
  }

  private async completeUpload(
    uploadId: string,
    result: ValidationResult,
  ): Promise<void> {
    const completed = await this.uploadRepository.complete(
      uploadId,
      result,
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

  private validateDuplicateRow(
    uploadId: string,
    row: ParsedRow,
    definition: SchemaDefinition,
    state: ValidationState,
  ): ValidationErrorEntity[] {
    const signature = this.getRowSignature(row, definition);
    const firstRowNumber = state.rowSignatures.get(signature);

    if (firstRowNumber === undefined) {
      state.rowSignatures.set(signature, row.rowNumber);
      return [];
    }

    return [
      this.error(
        uploadId,
        row.rowNumber,
        "_row",
        "DUPLICATE_ROW",
        `La ligne duplique la ligne ${firstRowNumber}`,
        `Ligne ${firstRowNumber}`,
      ),
    ];
  }

  private getRowSignature(
    row: ParsedRow,
    definition: SchemaDefinition,
  ): string {
    return JSON.stringify(
      definition.columns.map((column) => row.values[column.name] ?? ""),
    );
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
