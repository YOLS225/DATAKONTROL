export type DashboardPeriod = '7d' | '30d' | '90d' | 'all';

export type DashboardStatsSummary = {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  uploadsWithErrors: number;
  successRate: number;
  errorRate: number;
  totalInvalidRows: number;
};

export type DashboardUploadsBySource = {
  sourceId: string;
  sourceName: string;
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  uploadsWithErrors: number;
  invalidRows: number;
};

export type DashboardActiveSource = {
  sourceId: string;
  sourceName: string;
  totalUploads: number;
  lastUploadAt?: string;
  successRate: number;
  invalidRows: number;
};

export type DashboardErrorType = {
  type: 'MISSING_COLUMN' | 'UNKNOWN_COLUMN' | 'REQUIRED' | 'INVALID_TYPE' | string;
  label: string;
  count: number;
};

export type DashboardStats = {
  summary: DashboardStatsSummary;
  uploadsBySource: DashboardUploadsBySource[];
  mostActiveSources: DashboardActiveSource[];
  errorTypes: DashboardErrorType[];
};

export type DashboardStatsResponse = DashboardStats | { data?: DashboardStats; success?: boolean; message?: string };
