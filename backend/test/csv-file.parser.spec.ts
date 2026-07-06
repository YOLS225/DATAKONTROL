import { Readable } from "node:stream";
import { describe, expect, it } from "@jest/globals";
import type { ParsedRow } from "../src/domain/ports/services/file-parser.js";
import { CsvFileParser } from "../src/infrastructure/parsers/csv-file.parser.js";

describe("CsvFileParser", () => {
  const parser = new CsvFileParser();

  it("parses trimmed headers and preserves CSV row numbers", async () => {
    const result = await collect(
      parser.parse(fileInput(" name , age\nAlice,30\n\nBob,25\n")),
    );

    expect(result).toEqual([
      { rowNumber: 2, values: { name: "Alice", age: "30" } },
      { rowNumber: 4, values: { name: "Bob", age: "25" } },
    ]);
  });

  it("rejects duplicate headers regardless of case", async () => {
    await expect(
      collect(parser.parse(fileInput("email,Email\na@b.test,b@c.test\n"))),
    ).rejects.toThrow("CSV headers must be unique");
  });

  it("rejects empty headers", async () => {
    await expect(
      collect(parser.parse(fileInput("name,,age\nAlice,x,30\n"))),
    ).rejects.toThrow("CSV headers cannot be empty");
  });
});

async function collect(rows: AsyncIterable<ParsedRow>): Promise<ParsedRow[]> {
  const result: ParsedRow[] = [];
  for await (const row of rows) result.push(row);
  return result;
}

function fileInput(content: string) {
  return {
    stream: Readable.from(content),
    fileName: "customers.csv",
    fileType: "text/csv",
  };
}
