export type UploadStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;

export type UploadItem = {
  id: string;
  sourceId?: string;
  status?: UploadStatus;
  filename?: string;
  fileName?: string;
  originalName?: string;
  originalFilename?: string;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  errorCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UploadListParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export type UploadResponse = UploadItem | { data?: UploadItem; message?: string; success?: boolean };

export type UploadListResponse =
  | UploadItem[]
  | {
      data?:
        | UploadItem[]
        | {
            content?: UploadItem[];
            total?: number;
            page?: number;
            page_size?: number;
          };
      content?: UploadItem[];
      success?: boolean;
      message?: string;
    };
