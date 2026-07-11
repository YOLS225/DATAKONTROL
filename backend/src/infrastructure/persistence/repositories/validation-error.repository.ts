import { Injectable } from "@nestjs/common";
import { ValidationErrorEntity } from "../../../domain/entities/validation-error.entity.js";
import type {
  ListValidationErrorsQuery,
  PaginatedValidationErrors,
  ValidationErrorRepository,
} from "../../../domain/ports/repositories/validation-error.repository.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class PrismaValidationErrorRepository implements ValidationErrorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveMany(errors: ValidationErrorEntity[]): Promise<void> {
    if (errors.length === 0) return;
    await this.prisma.validationError.createMany({
      data: errors.map((error) => ({
        id: error.id,
        uploadId: error.uploadId,
        rowNumber: error.rowNumber,
        columnName: error.columnName,
        errorType: error.errorType,
        errorMessage: error.errorMessage,
        value: error.value,
      })),
    });
  }

  async deleteByUploadId(uploadId: string): Promise<void> {
    await this.prisma.validationError.deleteMany({ where: { uploadId } });
  }

  async findAll({
    uploadId,
    page,
    pageSize,
  }: ListValidationErrorsQuery): Promise<PaginatedValidationErrors> {
    const where = { uploadId };
    const [records, total] = await Promise.all([
      this.prisma.validationError.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ rowNumber: "asc" }, { columnName: "asc" }],
      }),
      this.prisma.validationError.count({ where }),
    ]);

    return {
      content: records.map(
        (record) =>
          new ValidationErrorEntity(
            record.id,
            record.uploadId,
            record.rowNumber,
            record.columnName,
            this.toDomainErrorType(record.errorType),
            record.errorMessage,
            record.value,
          ),
      ),
      total,
      page,
      page_size: pageSize,
    };
  }

  async findInvalidRowNumbers(uploadId: string): Promise<Set<number>> {
    const rows = await this.prisma.validationError.findMany({
      where: { uploadId },
      select: { rowNumber: true },
      distinct: ["rowNumber"],
    });
    return new Set(rows.map((row) => row.rowNumber));
  }

  async hasHeaderErrors(uploadId: string): Promise<boolean> {
    const count = await this.prisma.validationError.count({
      where: {
        uploadId,
        rowNumber: 1,
        errorType: { in: ["MISSING_COLUMN", "UNKNOWN_COLUMN"] },
      },
    });
    return count > 0;
  }

  private toDomainErrorType(
    errorType: string,
  ): ValidationErrorEntity["errorType"] {
    switch (errorType) {
      case "MISSING_COLUMN":
      case "UNKNOWN_COLUMN":
      case "REQUIRED":
      case "INVALID_TYPE":
      case "DUPLICATE_ROW":
        return errorType;
      default:
        throw new Error(`Unknown validation error type: ${errorType}`);
    }
  }
}
