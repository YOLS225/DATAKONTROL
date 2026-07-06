import type { Upload } from "../../entities/upload.entity.js";

export const UPLOAD_REPOSITORY = Symbol("UPLOAD_REPOSITORY");

export interface ListUploadsQuery {
  sourceId: string;
  page: number;
  pageSize: number;
  search?: string;
}

export interface PaginatedUploads {
  content: Upload[];
  total: number;
  page: number;
  page_size: number;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface UploadRepository {
  save(upload: Upload): Promise<void>;
  findById(id: string): Promise<Upload | null>;
  findAll(query: ListUploadsQuery): Promise<PaginatedUploads>;
  markProcessing(id: string): Promise<boolean>;
  fail(id: string, completedAt: Date): Promise<boolean>;
  complete(
    id: string,
    summary: ValidationSummary,
    completedAt: Date,
  ): Promise<boolean>;
}
