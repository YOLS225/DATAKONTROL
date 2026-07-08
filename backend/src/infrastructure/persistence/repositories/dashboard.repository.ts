import { Injectable } from "@nestjs/common";
import { UploadStatus } from "../../../domain/entities/upload.entity.js";
import type {
  DashboardRepository,
  DashboardStats,
  DashboardStatsQuery,
  ErrorTypeStats,
  MostActiveSourceStats,
  UploadsBySourceStats,
} from "../../../domain/ports/repositories/dashboard.repository.js";
import { PrismaService } from "../prisma/prisma.service.js";

const ERROR_LABELS: Record<string, string> = {
  MISSING_COLUMN: "Colonne manquante",
  UNKNOWN_COLUMN: "Colonne inconnue",
  REQUIRED: "Champ requis",
  INVALID_TYPE: "Type invalide",
};

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats({ userId, from }: DashboardStatsQuery): Promise<DashboardStats> {
    const uploadWhere = {
      userId,
      ...(from && { createdAt: { gte: from } }),
    };

    const [
      uploadsBySource,
      successfulUploadsBySource,
      failedUploadsBySource,
      uploadsWithErrorsBySource,
      errorTypes,
    ] = await Promise.all([
      this.prisma.upload.groupBy({
        by: ["sourceId"],
        where: uploadWhere,
        _count: { _all: true },
        _sum: { invalidRows: true },
        _max: { createdAt: true },
      }),
      this.prisma.upload.groupBy({
        by: ["sourceId"],
        where: {
          ...uploadWhere,
          status: UploadStatus.COMPLETED,
          invalidRows: 0,
        },
        _count: { _all: true },
      }),
      this.prisma.upload.groupBy({
        by: ["sourceId"],
        where: { ...uploadWhere, status: UploadStatus.FAILED },
        _count: { _all: true },
      }),
      this.prisma.upload.groupBy({
        by: ["sourceId"],
        where: {
          ...uploadWhere,
          status: UploadStatus.COMPLETED,
          invalidRows: { gt: 0 },
        },
        _count: { _all: true },
      }),
      this.prisma.validationError.groupBy({
        by: ["errorType"],
        where: {
          upload: uploadWhere,
        },
        _count: { _all: true },
      }),
    ]);

    const sourceIds = uploadsBySource.map((item) => item.sourceId);
    const sources = await this.prisma.source.findMany({
      where: { id: { in: sourceIds }, userId },
      select: { id: true, name: true },
    });
    const sourceNames = new Map(
      sources.map((source) => [source.id, source.name]),
    );

    const sourceStats = uploadsBySource.map((item) => ({
      sourceId: item.sourceId,
      sourceName: sourceNames.get(item.sourceId) ?? "Source supprimée",
      totalUploads: item._count._all,
      successfulUploads: this.getCount(successfulUploadsBySource, item.sourceId),
      failedUploads: this.getCount(failedUploadsBySource, item.sourceId),
      uploadsWithErrors: this.getCount(uploadsWithErrorsBySource, item.sourceId),
      invalidRows: item._sum.invalidRows ?? 0,
    }));

    return {
      summary: this.toSummary(sourceStats),
      uploadsBySource: sourceStats,
      mostActiveSources: this.toMostActiveSources(uploadsBySource, sourceStats),
      errorTypes: this.toErrorTypes(errorTypes),
    };
  }

  private getCount(
    rows: Array<{ sourceId: string; _count: { _all: number } }>,
    sourceId: string,
  ): number {
    return rows.find((row) => row.sourceId === sourceId)?._count._all ?? 0;
  }

  private toMostActiveSources(
    rows: Array<{
      sourceId: string;
      _count: { _all: number };
      _max: { createdAt: Date | null };
    }>,
    sourceStats: UploadsBySourceStats[],
  ): MostActiveSourceStats[] {
    const statsBySource = new Map(
      sourceStats.map((stats) => [stats.sourceId, stats]),
    );

    return rows
      .filter(
        (row): row is typeof row & { _max: { createdAt: Date } } =>
          row._max.createdAt !== null,
      )
      .map((row) => {
        const stats = statsBySource.get(row.sourceId);
        return {
          sourceId: row.sourceId,
          sourceName: stats?.sourceName ?? "Source supprimée",
          totalUploads: row._count._all,
          lastUploadAt: row._max.createdAt,
          successRate: this.percentage(stats?.successfulUploads ?? 0, row._count._all),
          invalidRows: stats?.invalidRows ?? 0,
        };
      })
      .sort((left, right) => {
        if (right.totalUploads !== left.totalUploads) {
          return right.totalUploads - left.totalUploads;
        }
        return right.lastUploadAt.getTime() - left.lastUploadAt.getTime();
      });
  }

  private toSummary(sourceStats: UploadsBySourceStats[]) {
    const summary = sourceStats.reduce(
      (accumulator, source) => ({
        totalUploads: accumulator.totalUploads + source.totalUploads,
        successfulUploads:
          accumulator.successfulUploads + source.successfulUploads,
        failedUploads: accumulator.failedUploads + source.failedUploads,
        uploadsWithErrors:
          accumulator.uploadsWithErrors + source.uploadsWithErrors,
        totalInvalidRows: accumulator.totalInvalidRows + source.invalidRows,
      }),
      {
        totalUploads: 0,
        successfulUploads: 0,
        failedUploads: 0,
        uploadsWithErrors: 0,
        totalInvalidRows: 0,
      },
    );

    const successRate = this.percentage(
      summary.successfulUploads,
      summary.totalUploads,
    );

    return {
      ...summary,
      successRate,
      errorRate: this.roundPercentage(100 - successRate),
    };
  }

  private percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return this.roundPercentage((value / total) * 100);
  }

  private roundPercentage(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private toErrorTypes(
    rows: Array<{ errorType: string; _count: { _all: number } }>,
  ): ErrorTypeStats[] {
    return rows
      .map((row) => ({
        type: row.errorType,
        label: ERROR_LABELS[row.errorType] ?? row.errorType,
        count: row._count._all,
      }))
      .sort((left, right) => right.count - left.count);
  }
}
