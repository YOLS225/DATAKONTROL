import { axiosInstance } from '@/shared/api/axios-instance';
import type {
  SchemaVersion,
  SchemaVersionListResponse,
  UpsertSchemaVersionPayload,
} from '@/features/schemas/types/schema-version';

export type SchemaVersionResponse =
  | SchemaVersion
  | { data?: SchemaVersion; message?: string; success?: boolean }
  | string
  | null;

class SchemaVersionService {
  async createDraft(sourceId: string, data?: UpsertSchemaVersionPayload) {
    return axiosInstance.post<SchemaVersion>(`/source/${sourceId}/schema-versions`, data ?? {});
  }

  async listVersions(sourceId: string, params?: { page?: number; page_size?: number }) {
    return axiosInstance.get<SchemaVersionListResponse>(`/source/${sourceId}/schema-versions`, {
      params,
    });
  }

  async getVersion(sourceId: string, id: string) {
    return axiosInstance.get<SchemaVersionResponse>(`/source/${sourceId}/schema-versions/${id}`);
  }

  async updateDraft(sourceId: string, id: string, data: UpsertSchemaVersionPayload) {
    return axiosInstance.patch<SchemaVersionResponse>(`/source/${sourceId}/schema-versions/${id}`, data);
  }

  async publishVersion(sourceId: string, id: string) {
    return axiosInstance.post<SchemaVersion>(`/source/${sourceId}/schema-versions/${id}/publish`);
  }

  async deleteVersion(sourceId: string, id: string) {
    return axiosInstance.delete(`/source/${sourceId}/schema-versions/${id}`);
  }
}

export const schemaVersionService = new SchemaVersionService();
