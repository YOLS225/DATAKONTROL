export type UploadErrorType =
  | 'MISSING_COLUMN'
  | 'UNKNOWN_COLUMN'
  | 'REQUIRED'
  | 'INVALID_TYPE'
  | 'DUPLICATE_ROW'
  | string;

export type UploadErrorItem = {
  id?: string;
  uploadId?: string;
  rowNumber?: number;
  row?: number;
  line?: number;
  columnName?: string;
  column?: string;
  field?: string;
  type?: UploadErrorType;
  errorType?: UploadErrorType;
  code?: UploadErrorType;
  message?: string;
  value?: string | number | boolean | null;
  createdAt?: string;
};

export type UploadErrorListResponse =
  | UploadErrorItem[]
  | {
      data?:
        | UploadErrorItem[]
        | {
            content?: UploadErrorItem[];
            total?: number;
            page?: number;
            page_size?: number;
          };
      content?: UploadErrorItem[];
      success?: boolean;
      message?: string;
    };
