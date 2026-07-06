import type { ValidationErrorEntity } from "../../entities/validation-error.entity.js";

export const VALIDATION_ERROR_REPOSITORY = Symbol(
  "VALIDATION_ERROR_REPOSITORY",
);

export interface ListValidationErrorsQuery {
  uploadId: string;
  page: number;
  pageSize: number;
}

export interface PaginatedValidationErrors {
  content: ValidationErrorEntity[];
  total: number;
  page: number;
  page_size: number;
}

export interface ValidationErrorRepository {
  saveMany(errors: ValidationErrorEntity[]): Promise<void>;
  deleteByUploadId(uploadId: string): Promise<void>;
  findAll(query: ListValidationErrorsQuery): Promise<PaginatedValidationErrors>;
}
