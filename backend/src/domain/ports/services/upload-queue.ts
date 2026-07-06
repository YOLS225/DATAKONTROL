export const UPLOAD_QUEUE = Symbol("UPLOAD_QUEUE");

export interface UploadQueue {
  enqueue(uploadId: string): Promise<void>;
}
