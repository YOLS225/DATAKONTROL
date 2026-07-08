'use client';

import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { uploadService } from '@/features/uploads/api/upload-service';
import { useUploadWatchStore } from '@/features/uploads/stores/upload-watch-store';
import { getUploadFilename, isRunningUploadStatus, unwrapUpload } from '@/features/uploads/utils/upload-utils';

export function UploadStatusListener() {
  const queryClient = useQueryClient();
  const watches = useUploadWatchStore((state) => state.watches);
  const updateWatchStatus = useUploadWatchStore((state) => state.updateWatchStatus);
  const removeWatch = useUploadWatchStore((state) => state.removeWatch);

  const results = useQueries({
    queries: watches.map((watch) => ({
      queryKey: ['upload-watch', watch.sourceId, watch.uploadId],
      queryFn: async () => unwrapUpload((await uploadService.getUpload(watch.sourceId, watch.uploadId)).data),
      enabled: isRunningUploadStatus(watch.status),
      refetchInterval: isRunningUploadStatus(watch.status) ? 3000 : false,
    })),
  });

  useEffect(() => {
    results.forEach((result, index) => {
      const watch = watches[index];
      const upload = result.data;

      if (!watch || !upload?.status) {
        return;
      }

      const statusChanged = watch.status !== upload.status;
      const wasRunning = isRunningUploadStatus(watch.status);

      if (!statusChanged) {
        return;
      }

      updateWatchStatus(watch.uploadId, upload.status);
      queryClient.invalidateQueries({ queryKey: ['uploads', watch.sourceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      if (wasRunning && upload.status === 'COMPLETED') {
        const invalidRows = upload.invalidRows ?? upload.errorCount ?? 0;
        const fileName = getUploadFilename(upload) || watch.fileName;

        if (invalidRows > 0) {
          toast.warning('Traitement termine avec erreurs', {
            description: `${fileName} contient ${invalidRows} ligne${invalidRows > 1 ? 's' : ''} invalide${invalidRows > 1 ? 's' : ''}.`,
          });
        } else {
          toast.success('Traitement termine', {
            description: `${fileName} est valide.`,
          });
        }

        removeWatch(watch.uploadId);
      }

      if (wasRunning && upload.status === 'FAILED') {
        toast.error('Traitement echoue', {
          description: getUploadFilename(upload) || watch.fileName,
        });
        removeWatch(watch.uploadId);
      }
    });
  }, [queryClient, removeWatch, results, updateWatchStatus, watches]);

  return null;
}
