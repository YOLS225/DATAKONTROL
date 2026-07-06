import type { Readable } from "node:stream";
import { Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";
import type {
  FileParser,
  ParseFileInput,
  ParsedRow,
} from "../../domain/ports/services/file-parser.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class ExcelFileParser implements FileParser {
  async *parse({ stream }: ParseFileInput): AsyncIterable<ParsedRow> {
    const buffer = await this.toBuffer(stream);
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      dense: true,
      WTF: true,
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel workbook does not contain a sheet");

    const sheet = workbook.Sheets[sheetName];
    const sheetRange = sheet["!ref"]
      ? XLSX.utils.decode_range(sheet["!ref"])
      : null;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: true,
    });
    if (rows.length === 0) throw new Error("Excel worksheet is empty");

    const headers = this.validateHeaders(rows[0]);
    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index] ?? [];
      if (row.every((value) => this.toCellString(value).length === 0)) continue;

      yield {
        rowNumber: (sheetRange?.s.r ?? 0) + index + 1,
        values: Object.fromEntries(
          headers.map((header, columnIndex) => [
            header,
            this.toCellString(row[columnIndex]),
          ]),
        ),
      };
    }
  }

  private validateHeaders(row: unknown[]): string[] {
    const headers = row.map((value) => this.toCellString(value).trim());
    if (headers.some((header) => header.length === 0)) {
      throw new Error("Excel headers cannot be empty");
    }
    const unique = new Set(headers.map((header) => header.toLowerCase()));
    if (unique.size !== headers.length) {
      throw new Error("Excel headers must be unique");
    }
    return headers;
  }

  private toCellString(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) {
      const iso = value.toISOString();
      return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso;
    }
    return String(value).trim();
  }

  private async toBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_FILE_SIZE) {
        throw new Error("Excel file exceeds the 10 MB processing limit");
      }
      chunks.push(buffer);
    }
    return Buffer.concat(chunks);
  }
}
