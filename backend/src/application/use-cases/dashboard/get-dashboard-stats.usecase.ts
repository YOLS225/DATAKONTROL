import type {
  DashboardRepository,
  DashboardStats,
} from "../../../domain/ports/repositories/dashboard.repository.js";

export type DashboardPeriod = "7d" | "30d" | "90d" | "all";

const PERIOD_DAYS: Record<Exclude<DashboardPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export class GetDashboardStatsUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  execute(userId: string, period: DashboardPeriod = "30d"): Promise<DashboardStats> {
    return this.dashboardRepository.getStats({
      userId,
      from: this.getPeriodStart(period),
    });
  }

  private getPeriodStart(period: DashboardPeriod): Date | null {
    if (period === "all") return null;

    const date = new Date();
    date.setDate(date.getDate() - PERIOD_DAYS[period]);
    return date;
  }
}
