import { Injectable } from "@nestjs/common";
import type {
  ListSchemaVersionsQuery,
  PaginatedSchemaVersions,
  SchemaVersionRepository,
} from "../../../domain/ports/repositories/schema.repository.js";
import {
  SchemaVersion,
  type ColumnType,
  type SchemaColumn,
  type SchemaDefinition,
} from "../../../domain/entities/schema.entity.js";
import { PrismaService } from "../prisma/prisma.service.js";

const COLUMN_TYPES: ReadonlySet<ColumnType> = new Set([
  "string",
  "integer",
  "decimal",
  "boolean",
  "date",
  "datetime",
]);

@Injectable()
export class PrismaSchemaRepository implements SchemaVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(schema: SchemaVersion): Promise<void> {
    await this.prisma.schemaVersion.create({
      data: {
        id: schema.id,
        sourceId: schema.sourceId,
        version: schema.version,
        schemaDefinition: this.toPersistenceDefinition(schema.schemaDefinition),
        isActive: false,
        createdBy: schema.createdBy,
        createdAt: schema.createdAt,
      },
    });
  }

  async findById(id: string): Promise<SchemaVersion | null> {
    const record = await this.prisma.schemaVersion.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findActiveBySourceId(sourceId: string): Promise<SchemaVersion | null> {
    const record = await this.prisma.schemaVersion.findFirst({
      where: {
        sourceId,
        isActive: true,
        publishedAt: { not: null },
      },
      orderBy: { version: "desc" },
    });
    return record ? this.toDomain(record) : null;
  }

  async findDraftBySourceId(sourceId: string): Promise<SchemaVersion | null> {
    const record = await this.prisma.schemaVersion.findFirst({
      where: { sourceId, publishedAt: null },
      orderBy: { version: "desc" },
    });
    return record ? this.toDomain(record) : null;
  }

  async findLatestVersionNumber(sourceId: string): Promise<number | null> {
    const result = await this.prisma.schemaVersion.aggregate({
      where: { sourceId },
      _max: { version: true },
    });
    return result._max.version;
  }

  async findAll({
    sourceId,
    page,
    pageSize,
  }: ListSchemaVersionsQuery): Promise<PaginatedSchemaVersions> {
    const where = { sourceId };
    const [records, total] = await Promise.all([
      this.prisma.schemaVersion.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { version: "desc" },
      }),
      this.prisma.schemaVersion.count({ where }),
    ]);

    return {
      content: records.map((record) => this.toDomain(record)),
      total,
      page,
      page_size: pageSize,
    };
  }

  async updateDefinition(
    id: string,
    definition: SchemaDefinition,
  ): Promise<boolean> {
    const result = await this.prisma.schemaVersion.updateMany({
      where: { id, publishedAt: null },
      data: {
        schemaDefinition: this.toPersistenceDefinition(definition),
      },
    });
    return result.count === 1;
  }

  async publish(
    sourceId: string,
    schemaVersionId: string,
    version: number,
    publishedAt: Date,
  ): Promise<boolean> {
    return this.prisma.$transaction(
      async (transaction) => {
        const draft = await transaction.schemaVersion.findFirst({
          where: {
            id: schemaVersionId,
            sourceId,
            version,
            publishedAt: null,
          },
          select: { id: true },
        });
        if (!draft) return false;

        await transaction.schemaVersion.updateMany({
          where: { sourceId, isActive: true },
          data: { isActive: false },
        });

        await transaction.schemaVersion.update({
          where: { id: draft.id },
          data: { isActive: true, publishedAt },
        });

        await transaction.source.update({
          where: { id: sourceId },
          data: { currentSchemaVer: version },
        });

        return true;
      },
      { isolationLevel: "Serializable" },
    );
  }

  private toPersistenceDefinition(definition: SchemaDefinition) {
    return {
      columns: definition.columns.map((column) => ({
        id: column.id,
        name: column.name,
        type: column.type,
        required: column.required,
      })),
    };
  }

  private toDomain(record: {
    id: string;
    sourceId: string;
    version: number;
    schemaDefinition: unknown;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    publishedAt: Date | null;
  }): SchemaVersion {
    return new SchemaVersion(
      record.id,
      record.sourceId,
      record.version,
      this.toDomainDefinition(record.schemaDefinition),
      record.createdBy,
      record.isActive,
      record.createdAt,
      record.publishedAt,
    );
  }

  private toDomainDefinition(value: unknown): SchemaDefinition {
    if (!this.isRecord(value) || !Array.isArray(value.columns)) {
      throw new Error("Stored schema definition is invalid");
    }

    return { columns: value.columns.map((column) => this.toColumn(column)) };
  }

  private toColumn(value: unknown): SchemaColumn {
    if (
      !this.isRecord(value) ||
      typeof value.id !== "string" ||
      typeof value.name !== "string" ||
      typeof value.type !== "string" ||
      !COLUMN_TYPES.has(value.type as ColumnType) ||
      typeof value.required !== "boolean"
    ) {
      throw new Error("Stored schema column is invalid");
    }

    return {
      id: value.id,
      name: value.name,
      type: value.type as ColumnType,
      required: value.required,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
}
