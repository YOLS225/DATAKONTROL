import type { Readable } from "node:stream";
import { Injectable } from "@nestjs/common";
import { parse } from "csv-parse";
import type {
  FileParser,
  ParseFileInput,
  ParsedRow,
} from "../../domain/ports/services/file-parser.js";

@Injectable()
export class CsvFileParser implements FileParser {
  async *parse({ stream }: ParseFileInput): AsyncIterable<ParsedRow> {
    const parser = stream.pipe(
      parse({
        bom: true,
        columns: (headers: string[]) => this.validateHeaders(headers),
        info: true,
        skip_empty_lines: true,
        trim: true,
      }),
    );

    for await (const parsed of parser) {
      yield {
        rowNumber: parsed.info.lines,
        values: this.toStringRecord(parsed.record),
      };
    }
  }

  private validateHeaders(headers: string[]): string[] {
    const normalized = headers.map((header) => header.trim());
    const unique = new Set(normalized.map((header) => header.toLowerCase()));
    if (unique.size !== normalized.length) {
      throw new Error("CSV headers must be unique");
    }
    if (normalized.some((header) => header.length === 0)) {
      throw new Error("CSV headers cannot be empty");
    }
    return normalized;
  }

  private toStringRecord(value: unknown): Record<string, string> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("CSV parser returned an invalid row");
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, field]) => [key, String(field ?? "")]),
    );
  }
}
