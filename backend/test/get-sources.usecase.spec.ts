import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { GetSourcesUsecase } from "../src/application/use-cases/sources/get-sources.usecase.js";
import {
  PaginatedSources,
  SourceRepository,
} from "../src/domain/ports/repositories/source.repository.js";

describe("GetSourcesUsecase", () => {
  let sources: Mocked<SourceRepository>;
  let useCase: GetSourcesUsecase;

  beforeEach(() => {
    sources = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new GetSourcesUsecase(sources);
  });

  it("lists only the current user's sources with pagination", async () => {
    const result: PaginatedSources = {
      content: [],
      total: 0,
      page: 2,
      page_size: 10,
    };
    sources.findAll.mockResolvedValue(result);

    await expect(
      useCase.execute("user-id", {
        page: 2,
        pageSize: 10,
        search: "hebdo",
      }),
    ).resolves.toBe(result);

    expect(sources.findAll).toHaveBeenCalledWith({
      userId: "user-id",
      page: 2,
      pageSize: 10,
      search: "hebdo",
    });
  });
});
