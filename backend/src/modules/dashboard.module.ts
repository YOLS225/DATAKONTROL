import { Module } from "@nestjs/common";
import { GetDashboardStatsUseCase } from "../application/use-cases/dashboard/get-dashboard-stats.usecase.js";
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
} from "../domain/ports/repositories/dashboard.repository.js";
import { PrismaDashboardRepository } from "../infrastructure/persistence/repositories/dashboard.repository.js";
import { DashboardController } from "../presentation/controllers/dashboard.controller.js";
import { UserModule } from "./user.module.js";

@Module({
  imports: [UserModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: PrismaDashboardRepository,
    },
    {
      provide: GetDashboardStatsUseCase,
      inject: [DASHBOARD_REPOSITORY],
      useFactory: (dashboard: DashboardRepository) =>
        new GetDashboardStatsUseCase(dashboard),
    },
  ],
})
export class DashboardModule {}
