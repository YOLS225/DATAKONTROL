import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "../presentation/controllers/health.controller.js";
import { InfrastructureModule } from "./infrastructure.module.js";
import { UserModule } from "./user.module.js";
import { SourceModule } from "./source.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InfrastructureModule,
    UserModule,
    SourceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
