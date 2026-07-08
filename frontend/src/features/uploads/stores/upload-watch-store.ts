import { create } from 'zustand';
import { loadState, saveState } from '@/shared/stores/local-storage';
import type { UploadStatus } from '@/features/uploads/types/upload';

const UPLOAD_WATCH_STORAGE_KEY = 'datakontrol:upload-watches';

export type WatchedUpload = {
  sourceId: string;
  uploadId: string;
  fileName: string;
  status: UploadStatus;
};

type UploadWatchStore = {
  watches: WatchedUpload[];
  addWatch: (upload: WatchedUpload) => void;
  updateWatchStatus: (uploadId: string, status: UploadStatus) => void;
  removeWatch: (uploadId: string) => void;
};

const initialWatches = loadState<WatchedUpload[]>(UPLOAD_WATCH_STORAGE_KEY) ?? [];

const persistWatches = (watches: WatchedUpload[]) => {
  saveState(UPLOAD_WATCH_STORAGE_KEY, watches);
};

export const useUploadWatchStore = create<UploadWatchStore>((set) => ({
  watches: initialWatches,
  addWatch: (upload) =>
    set((state) => {
      const nextWatches = [
        ...state.watches.filter((watch) => watch.uploadId !== upload.uploadId),
        upload,
      ];

      persistWatches(nextWatches);
      return { watches: nextWatches };
    }),
  updateWatchStatus: (uploadId, status) =>
    set((state) => {
      const nextWatches = state.watches.map((watch) =>
        watch.uploadId === uploadId ? { ...watch, status } : watch
      );

      persistWatches(nextWatches);
      return { watches: nextWatches };
    }),
  removeWatch: (uploadId) =>
    set((state) => {
      const nextWatches = state.watches.filter((watch) => watch.uploadId !== uploadId);

      persistWatches(nextWatches);
      return { watches: nextWatches };
    }),
}));
