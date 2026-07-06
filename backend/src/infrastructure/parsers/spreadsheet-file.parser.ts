import { Injectable } from "@nestjs/common";
import type {
  FileParser,
  ParseFileInput,
  ParsedRow,
} from "../../domain/ports/services/file-parser.js";
import { CsvFileParser } from "./csv-file.parser.js";
import { ExcelFileParser } from "./excel-file.parser.js";

@Injectable()
export class SpreadsheetFileParser implements FileParser {
  constructor(
    private readonly csvParser: CsvFileParser,
    private readonly excelParser: ExcelFileParser,
  ) {}

  parse(input: ParseFileInput): AsyncIterable<ParsedRow> {
    const extension = input.fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "csv":
        return this.csvParser.parse(input);
      case "xls":
      case "xlsx":
        return this.excelParser.parse(input);
      default:
        throw new Error(`Unsupported file format: ${extension ?? "unknown"}`);
    }
  }
}
