import { Readable } from "node:stream";
import { NotFoundError } from "../../../common/exceptions/not_found.js";
import type { SchemaVersionRepository } from "../../../domain/ports/repositories/schema.repository.js";
import type { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
import type { UploadRepository } from "../../../domain/ports/repositories/upload.repository.js";
import type { ValidationErrorRepository } from "../../../domain/ports/repositories/validation-error.repository.js";
import type {
  FileParser,
  ParsedRow,
} from "../../../domain/ports/services/file-parser.js";
import type { FileStorage } from "../../../domain/ports/services/file-storage.js";

export interface ValidUploadRowsResult {
  stream: Readable;
  fileName: string;
  fileType: string;
}

export class GetValidUploadRowsUseCase {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly uploadRepository: UploadRepository,
    private readonly schemaRepository: SchemaVersionRepository,
    private readonly validationErrorRepository: ValidationErrorRepository,
    private readonly fileStorage: FileStorage,
    private readonly fileParser: FileParser,
  ) {}

  async execute(
    userId: string,
    sourceId: string,
    uploadId: string,
  ): Promise<ValidUploadRowsResult> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source || source.userId !== userId) {
      throw new NotFoundError("Source", sourceId);
    }

    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload || upload.sourceId !== sourceId) {
      throw new NotFoundError("Upload", uploadId);
    }

    const schema = await this.schemaRepository.findById(upload.schemaVersionId);
    if (!schema || schema.sourceId !== sourceId) {
      throw new NotFoundError("Schema version", upload.schemaVersionId);
    }

    const [invalidRows, hasHeaderErrors] = await Promise.all([
      this.validationErrorRepository.findInvalidRowNumbers(uploadId),
      this.validationErrorRepository.hasHeaderErrors(uploadId),
    ]);
    const stream = await this.fileStorage.read(upload.filePath);
    const columns = schema.schemaDefinition.columns.map((column) => column.name);

    return {
      stream: Readable.from(
        this.toCsvRows({
          columns,
          rows: this.fileParser.parse({
            stream,
            fileName: upload.fileName,
            fileType: upload.fileType,
          }),
          invalidRows,
          hasHeaderErrors,
        }),
      ),
      fileName: `valid-${this.withCsvExtension(upload.fileName)}`,
      fileType: "text/csv; charset=utf-8",
    };
  }

  private async *toCsvRows({
    columns,
    rows,
    invalidRows,
    hasHeaderErrors,
  }: {
    columns: string[];
    rows: AsyncIterable<ParsedRow>;
    invalidRows: Set<number>;
    hasHeaderErrors: boolean;
  }): AsyncIterable<string> {
    yield `${columns.map((column) => this.csvCell(column)).join(",")}\n`;

    if (hasHeaderErrors) return;

    for await (const row of rows) {
      if (invalidRows.has(row.rowNumber)) continue;
      yield `${columns.map((column) => this.csvCell(row.values[column] ?? "")).join(",")}\n`;
    }
  }

  private csvCell(value: string): string {
    if (!/[",\n\r]/.test(value)) return value;
    return `"${value.replaceAll('"', '""')}"`;
  }

  private withCsvExtension(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, "") + ".csv";
  }
}
