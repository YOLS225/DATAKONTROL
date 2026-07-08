import type { UploadItem, UploadResponse } from '@/features/uploads/types/upload';

export function getUploadFilename(upload: UploadItem) {
  return upload.originalName ?? upload.originalFilename ?? upload.fileName ?? upload.filename ?? 'Fichier recu';
}

export function unwrapUpload(payload: UploadResponse | UploadItem | { data?: UploadItem } | null | undefined) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('data' in payload) {
    return payload.data ?? null;
  }

  if ('id' in payload) {
    return payload;
  }

  return null;
}

export function isRunningUploadStatus(status?: string) {
  return status === 'PENDING' || status === 'PROCESSING';
}
