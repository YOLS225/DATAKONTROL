import { Injectable } from "@nestjs/common";
import {
  Upload,
  UploadStatus,
} from "../../../domain/entities/upload.entity.js";
import type {
  ListUploadsQuery,
  PaginatedUploads,
  UploadRepository,
  ValidationSummary,
} from "../../../domain/ports/repositories/upload.repository.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class PrismaUploadRepository implements UploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(upload: Upload): Promise<void> {
    await this.prisma.upload.create({
      data: {
        id: upload.id,
        sourceId: upload.sourceId,
        schemaVersionId: upload.schemaVersionId,
        userId: upload.userId,
        fileName: upload.fileName,
        fileSize: BigInt(upload.fileSize),
        filePath: upload.filePath,
        fileType: upload.fileType,
        status: upload.status,
        totalRows: upload.totalRows,
        validRows: upload.validRows,
        invalidRows: upload.invalidRows,
        createdAt: upload.createdAt,
        completedAt: upload.completedAt,
      },
    });
  }

  async findById(id: string): Promise<Upload | null> {
    const record = await this.prisma.upload.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findAll({
    sourceId,
    page,
    pageSize,
    search,
  }: ListUploadsQuery): Promise<PaginatedUploads> {
    const where = {
      sourceId,
      ...(search?.trim() && {
        fileName: { contains: search.trim(), mode: "insensitive" as const },
      }),
    };
    const [records, total] = await Promise.all([
      this.prisma.upload.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.upload.count({ where }),
    ]);

    return {
      content: records.map((record) => this.toDomain(record)),
      total,
      page,
      page_size: pageSize,
    };
  }

  async markProcessing(id: string): Promise<boolean> {
    const result = await this.prisma.upload.updateMany({
      where: { id, status: UploadStatus.PENDING },
      data: { status: UploadStatus.PROCESSING },
    });
    return result.count === 1;
  }

  async fail(id: string, completedAt: Date): Promise<boolean> {
    const result = await this.prisma.upload.updateMany({
      where: {
        id,
        status: { in: [UploadStatus.PENDING, UploadStatus.PROCESSING] },
      },
      data: { status: UploadStatus.FAILED, completedAt },
    });
    return result.count === 1;
  }

  async complete(
    id: string,
    summary: ValidationSummary,
    completedAt: Date,
  ): Promise<boolean> {
    const result = await this.prisma.upload.updateMany({
      where: { id, status: UploadStatus.PROCESSING },
      data: {
        status: UploadStatus.COMPLETED,
        totalRows: summary.totalRows,
        validRows: summary.validRows,
        invalidRows: summary.invalidRows,
        completedAt,
      },
    });
    return result.count === 1;
  }

  private toDomain(record: {
    id: string;
    sourceId: string;
    schemaVersionId: string;
    userId: string;
    fileName: string;
    fileSize: bigint;
    filePath: string;
    fileType: string;
    status: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    createdAt: Date;
    completedAt: Date | null;
  }): Upload {
    const fileSize = Number(record.fileSize);
    if (!Number.isSafeInteger(fileSize)) {
      throw new Error(`Upload file size is outside JavaScript's safe range`);
    }

    return new Upload(
      record.id,
      record.sourceId,
      record.schemaVersionId,
      record.userId,
      record.fileName,
      fileSize,
      record.filePath,
      record.fileType,
      this.toDomainStatus(record.status),
      record.totalRows,
      record.validRows,
      record.invalidRows,
      record.createdAt,
      record.completedAt,
    );
  }

  private toDomainStatus(status: string): UploadStatus {
    switch (status) {
      case UploadStatus.PENDING:
        return UploadStatus.PENDING;
      case UploadStatus.PROCESSING:
        return UploadStatus.PROCESSING;
      case UploadStatus.COMPLETED:
        return UploadStatus.COMPLETED;
      case UploadStatus.FAILED:
        return UploadStatus.FAILED;
      default:
        throw new Error(`Unknown upload status: ${status}`);
    }
  }
}
