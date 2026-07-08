import { Injectable } from "@nestjs/common";
import {
  ListSourcesQuery,
  PaginatedSources,
  SourceRepository,
  UpdateSourceData,
} from "../../../domain/ports/repositories/source.repository.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { Source } from "../../../domain/entities/source.entity.js";

@Injectable()
export class PrismaSourceRepository implements SourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Source | null> {
    const record = await this.prisma.source.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByName(userId: string, name: string): Promise<Source | null> {
    const record = await this.prisma.source.findUnique({
      where: { userId_name: { userId, name } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll({
    userId,
    page,
    pageSize,
    search,
  }: ListSourcesQuery): Promise<PaginatedSources> {
    const skip = (page - 1) * pageSize;
    const where = {
      userId,
      ...(search?.trim() && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };
    const [content, total] = await Promise.all([
      this.prisma.source.findMany({
        skip,
        take: pageSize,
        where,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" as const },
      }),
      this.prisma.source.count({ where }),
    ]);

    return { content, total, page, page_size: pageSize };
  }

  async update(id: string, source: UpdateSourceData): Promise<void> {
    await this.prisma.source.update({
      where: { id },
      data: source,
    });
  }

  async countLinks(id: string): Promise<number> {
    const [schemaVersions, uploads] = await Promise.all([
      this.prisma.schemaVersion.count({ where: { sourceId: id } }),
      this.prisma.upload.count({ where: { sourceId: id } }),
    ]);
    return schemaVersions + uploads;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.source.delete({ where: { id } });
  }

  async save(source: Source): Promise<void> {
    await this.prisma.source.create({
      data: {
        id: source.id,
        userId: source.userId,
        name: source.name,
        description: source.description,
        createdAt: source.createdAt,
      },
    });
  }

  private toDomain(record: {
    id: string;
    name: string;
    description: string;
    userId: string;
    createdAt: Date;
    currentSchemaVer: number | null;
    updatedAt: Date;
  }): Source {
    return new Source(
      record.id,
      record.name,
      record.description,
      record.userId,
      record.createdAt,
      record.currentSchemaVer,
      record.updatedAt,
    );
  }
}
