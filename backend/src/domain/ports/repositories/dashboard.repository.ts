export const DASHBOARD_REPOSITORY = Symbol("DASHBOARD_REPOSITORY");

export interface DashboardStatsQuery {
  userId: string;
  from: Date | null;
}

export interface UploadsBySourceStats {
  sourceId: string;
  sourceName: string;
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  uploadsWithErrors: number;
  invalidRows: number;
}

export interface MostActiveSourceStats {
  sourceId: string;
  sourceName: string;
  totalUploads: number;
  lastUploadAt: Date;
  successRate: number;
  invalidRows: number;
}

export interface ErrorTypeStats {
  type: string;
  label: string;
  count: number;
}

export interface DashboardStatsSummary {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  uploadsWithErrors: number;
  successRate: number;
  errorRate: number;
  totalInvalidRows: number;
}

export interface DashboardStats {
  summary: DashboardStatsSummary;
  uploadsBySource: UploadsBySourceStats[];
  mostActiveSources: MostActiveSourceStats[];
  errorTypes: ErrorTypeStats[];
}

export interface DashboardRepository {
  getStats(query: DashboardStatsQuery): Promise<DashboardStats>;
}
