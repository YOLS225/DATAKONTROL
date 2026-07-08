import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mocked } from "jest-mock";
import { GetDashboardStatsUseCase } from "../src/application/use-cases/dashboard/get-dashboard-stats.usecase.js";
import type { DashboardRepository } from "../src/domain/ports/repositories/dashboard.repository.js";

describe("Get dashboard stats use case", () => {
  let dashboard: Mocked<DashboardRepository>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-08T10:30:00.000Z"));
    dashboard = {
      getStats: jest.fn().mockResolvedValue({
        summary: {
          totalUploads: 0,
          successfulUploads: 0,
          failedUploads: 0,
          uploadsWithErrors: 0,
          successRate: 0,
          errorRate: 0,
          totalInvalidRows: 0,
        },
        uploadsBySource: [],
        mostActiveSources: [],
        errorTypes: [],
      }),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses a 30 day period by default", async () => {
    const useCase = new GetDashboardStatsUseCase(dashboard);

    await useCase.execute("user-id");

    expect(dashboard.getStats).toHaveBeenCalledWith({
      userId: "user-id",
      from: new Date("2026-06-08T10:30:00.000Z"),
    });
  });

  it("supports all-time stats", async () => {
    const useCase = new GetDashboardStatsUseCase(dashboard);

    await useCase.execute("user-id", "all");

    expect(dashboard.getStats).toHaveBeenCalledWith({
      userId: "user-id",
      from: null,
    });
  });
});
