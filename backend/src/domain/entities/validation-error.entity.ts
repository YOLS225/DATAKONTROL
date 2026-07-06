export type ValidationErrorType =
  "MISSING_COLUMN" | "UNKNOWN_COLUMN" | "REQUIRED" | "INVALID_TYPE";

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
