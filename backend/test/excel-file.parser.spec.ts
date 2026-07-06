import { Readable } from "node:stream";
import { describe, expect, it } from "@jest/globals";
import * as XLSX from "xlsx";
import type { ParsedRow } from "../src/domain/ports/services/file-parser.js";
import { ExcelFileParser } from "../src/infrastructure/parsers/excel-file.parser.js";

describe("ExcelFileParser", () => {
  const parser = new ExcelFileParser();

  it.each(["xlsx", "xls"] as const)("parses %s workbooks", async (format) => {
    const result = await collect(
      parser.parse({
        stream: Readable.from([workbook(format)]),
        fileName: `customers.${format}`,
        fileType:
          format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/vnd.ms-excel",
      }),
    );

    expect(result).toEqual([
      {
        rowNumber: 2,
        values: { name: "Alice", age: "30", active: "true" },
      },
      {
        rowNumber: 4,
        values: { name: "Bob", age: "25", active: "false" },
      },
    ]);
  });

  it("rejects duplicate headers", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["email", "Email"],
      ["a@b.test", "b@c.test"],
    ]);

    await expect(
      collect(
        parser.parse({
          stream: Readable.from([write(sheet, "xlsx")]),
          fileName: "customers.xlsx",
          fileType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      ),
    ).rejects.toThrow("Excel headers must be unique");
  });
});

function workbook(format: "xlsx" | "xls"): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["name", "age", "active"],
    ["Alice", 30, true],
    [],
    ["Bob", 25, false],
  ]);
  return write(sheet, format);
}

function write(sheet: XLSX.WorkSheet, format: "xlsx" | "xls"): Buffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  return XLSX.write(workbook, { type: "buffer", bookType: format });
}

async function collect(rows: AsyncIterable<ParsedRow>): Promise<ParsedRow[]> {
  const result: ParsedRow[] = [];
  for await (const row of rows) result.push(row);
  return result;
}
