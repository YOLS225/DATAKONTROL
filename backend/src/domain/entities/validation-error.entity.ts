export type ValidationErrorType =
  | "MISSING_COLUMN"
  | "UNKNOWN_COLUMN"
  | "REQUIRED"
  | "INVALID_TYPE"
  | "DUPLICATE_ROW"
  | "MIN_LENGTH"
  | "MAX_LENGTH"
  | "INVALID_FORMAT"
  | "NOT_ALLOWED_VALUE"
  | "MIN_VALUE"
  | "MAX_VALUE"
  | "MIN_DATE"
  | "MAX_DATE";

export class ValidationErrorEntity {
  constructor(
    public readonly id: string,
    public readonly uploadId: string,
    public readonly rowNumber: number,
    public readonly columnName: string,
    public readonly errorType: ValidationErrorType,
    public readonly errorMessage: string,
    public readonly value: string | null = null,
  ) {}
}
