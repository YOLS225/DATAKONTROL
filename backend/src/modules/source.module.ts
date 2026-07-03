import { Module } from "@nestjs/common";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../domain/ports/repositories/user.repository.js";
import { SourceController } from "../presentation/controllers/source.controller.js";
import {
  SOURCE_REPOSITORY,
  SourceRepository,
} from "../domain/ports/repositories/source.repository.js";
import { CreateSourceUseCase } from "../application/use-cases/sources/create-source.usecase.js";
import { PrismaSourceRepository } from "../infrastructure/persistence/repositories/source.repository.js";
import { UserModule } from "./user.module.js";

@Module({
  imports: [UserModule],
  controllers: [SourceController],
  providers: [
    {
      provide: SOURCE_REPOSITORY,
      useClass: PrismaSourceRepository,
    },
    {
      provide: CreateSourceUseCase,
      inject: [USER_REPOSITORY, SOURCE_REPOSITORY],
      useFactory: (users: UserRepository, sources: SourceRepository) =>
        new CreateSourceUseCase(users, sources),
    },
  ],
})
export class SourceModule {}
