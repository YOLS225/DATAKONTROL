import type { Readable } from "node:stream";

export const FILE_PARSER = Symbol("FILE_PARSER");

export interface ParsedRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ParseFileInput {
  stream: Readable;
  fileName: string;
  fileType: string;
}

export interface FileParser {
  parse(input: ParseFileInput): AsyncIterable<ParsedRow>;
}
