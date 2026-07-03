import { Injectable } from "@nestjs/common";
import { SourceRepository } from "../../../domain/ports/repositories/source.repository.js";
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

  findAll(): Promise<Source[]> {
    throw new Error("Method not implemented.");
  }

  update(id: string, source: Source): Promise<void> {
    throw new Error("Method not implemented.");
  }

  delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
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
  }): Source {
    return new Source(
      record.id,
      record.name,
      record.description,
      record.userId,
      record.createdAt,
    );
  }
}
