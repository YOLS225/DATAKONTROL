import { axiosInstance } from '@/shared/api/axios-instance';
import type { UploadItem, UploadListParams, UploadListResponse, UploadResponse } from '@/features/uploads/types/upload';

class UploadService {
  async uploadFile(sourceId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return axiosInstance.post<UploadResponse>(`/source/${sourceId}/uploads`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async listUploads(sourceId: string, params?: UploadListParams) {
    return axiosInstance.get<UploadListResponse>(`/source/${sourceId}/uploads`, { params });
  }

  async getUpload(sourceId: string, id: string) {
    return axiosInstance.get<UploadItem | { data?: UploadItem }>(`/source/${sourceId}/uploads/${id}`);
  }

  async getUploadFile(sourceId: string, id: string) {
    return axiosInstance.get<Blob>(`/source/${sourceId}/uploads/${id}/file`, {
      responseType: 'blob',
    });
  }
}

export const uploadService = new UploadService();
