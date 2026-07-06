import type { Readable } from "node:stream";

export const FILE_STORAGE = Symbol("FILE_STORAGE");

export interface SaveFileInput {
  key: string;
  stream: Readable;
  contentType: string;
  contentLength: number;
}

export interface FileStorage {
  save(input: SaveFileInput): Promise<void>;
  read(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
}
