import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import type { DashboardPeriod } from "../../application/use-cases/dashboard/get-dashboard-stats.usecase.js";

const DASHBOARD_PERIODS: DashboardPeriod[] = ["7d", "30d", "90d", "all"];

export class DashboardStatsQueryDto {
  @ApiPropertyOptional({
    enum: DASHBOARD_PERIODS,
    default: "30d",
    example: "30d",
  })
  @IsOptional()
  @IsIn(DASHBOARD_PERIODS)
  period: DashboardPeriod = "30d";
}
