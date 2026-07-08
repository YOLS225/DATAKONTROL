import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GetDashboardStatsUseCase } from "../../application/use-cases/dashboard/get-dashboard-stats.usecase.js";
import type { DashboardStats } from "../../domain/ports/repositories/dashboard.repository.js";
import type { AuthTokenPayload } from "../../domain/ports/services/auth-token.service.js";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import { DashboardStatsQueryDto } from "../dto/dashboard.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
  ) {}

  @Get("stats")
  @ApiOperation({ summary: "Get dashboard statistics" })
  async stats(
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: DashboardStatsQueryDto,
  ): Promise<DashboardStats> {
    return this.getDashboardStatsUseCase.execute(
      user.userId,
      query.period,
    );
  }
}
