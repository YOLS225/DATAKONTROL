export type Source = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SourceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export type CreateSourcePayload = {
  name: string;
  description?: string;
};

export type UpdateSourcePayload = Partial<CreateSourcePayload>;

export type PaginatedSourcesResponse = {
  data?: Source[] | PaginatedSourcesResponse;
  content?: Source[];
  items?: Source[];
  results?: Source[];
  sources?: Source[];
  success?: boolean;
  message?: string;
  total?: number;
  page?: number;
  page_size?: number;
  meta?: {
    page?: number;
    pageSize?: number;
    page_size?: number;
    total?: number;
    totalPages?: number;
  };
};

export type SourceListResponse = Source[] | PaginatedSourcesResponse;
