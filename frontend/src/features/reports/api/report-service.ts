import { axiosInstance } from '@/shared/api/axios-instance';
import type { UploadErrorListResponse } from '@/features/reports/types/upload-error';

class ReportService {
  async listUploadErrors(sourceId: string, uploadId: string, params?: { page?: number; page_size?: number }) {
    return axiosInstance.get<UploadErrorListResponse>(`/source/${sourceId}/uploads/${uploadId}/errors`, {
      params,
    });
  }
}

export const reportService = new ReportService();
