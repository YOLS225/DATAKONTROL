import { axiosInstance } from '@/shared/api/axios-instance';
import type {
  CreateSourcePayload,
  Source,
  SourceListParams,
  SourceListResponse,
  UpdateSourcePayload,
} from '@/features/sources/types/source';

class SourceService {
  async createSource(data: CreateSourcePayload) {
    return axiosInstance.post<Source>('/source', data);
  }

  async listSources(params?: SourceListParams) {
    return axiosInstance.get<SourceListResponse>('/source', { params });
  }

  async getSource(id: string) {
    return axiosInstance.get<Source>(`/source/${id}`);
  }

  async updateSource(id: string, data: UpdateSourcePayload) {
    return axiosInstance.patch<Source>(`/source/${id}`, data);
  }
}

export const sourceService = new SourceService();
