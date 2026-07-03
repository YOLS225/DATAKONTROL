import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { UserRepository } from "../../../domain/ports/repositories/user.repository.js";
import { User } from "../../../domain/entities/user.entity.js";

@Injectable()
export class PrismaRegisterRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.passwordHash,
        createdAt: user.createdAt,
      },
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  private toDomain(record: {
    id: string;
    email: string;
    name: string;
    password: string;
    createdAt: Date;
    refreshTokenHash: string | null;
  }): User {
    return new User(
      record.id,
      record.email,
      record.name,
      record.password,
      record.createdAt,
      record.refreshTokenHash,
    );
  }
}
