import { Readable } from "node:stream";
import { describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import type { FileParser } from "../src/domain/ports/services/file-parser.js";
import { SpreadsheetFileParser } from "../src/infrastructure/parsers/spreadsheet-file.parser.js";
import type { CsvFileParser } from "../src/infrastructure/parsers/csv-file.parser.js";
import type { ExcelFileParser } from "../src/infrastructure/parsers/excel-file.parser.js";

describe("SpreadsheetFileParser", () => {
  it.each([
    ["data.csv", "csv"],
    ["data.xls", "excel"],
    ["data.xlsx", "excel"],
  ] as const)("routes %s to the %s parser", async (fileName, expected) => {
    const csv = parserMock();
    const excel = parserMock();
    const parser = new SpreadsheetFileParser(
      csv as unknown as CsvFileParser,
      excel as unknown as ExcelFileParser,
    );
    const input = {
      stream: Readable.from("file"),
      fileName,
      fileType: "application/octet-stream",
    };

    for await (const _row of parser.parse(input)) {
      // Empty mocked iterable.
    }

    expect(expected === "csv" ? csv.parse : excel.parse).toHaveBeenCalledWith(
      input,
    );
  });

  it("rejects unsupported extensions", () => {
    const parser = new SpreadsheetFileParser(
      parserMock() as unknown as CsvFileParser,
      parserMock() as unknown as ExcelFileParser,
    );

    expect(() =>
      parser.parse({
        stream: Readable.from("file"),
        fileName: "data.pdf",
        fileType: "application/pdf",
      }),
    ).toThrow("Unsupported file format");
  });
});

function parserMock(): Mocked<FileParser> {
  return {
    parse: jest.fn(() => emptyRows()),
  };
}

async function* emptyRows() {}
