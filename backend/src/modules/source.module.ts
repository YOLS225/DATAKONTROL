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
import { GetSourcesUsecase } from "../application/use-cases/sources/get-sources.usecase.js";
import { UpdateSourcesUsecase } from "../application/use-cases/sources/update-sources.usecase.js";
import { GetSourceUseCase } from "../application/use-cases/sources/get-source.usecase.js";
import { DeleteSourceUseCase } from "../application/use-cases/sources/delete-source.usecase.js";

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
    {
      provide: GetSourcesUsecase,
      inject: [SOURCE_REPOSITORY],
      useFactory: (sources: SourceRepository) => new GetSourcesUsecase(sources),
    },
    {
      provide: UpdateSourcesUsecase,
      inject: [SOURCE_REPOSITORY],
      useFactory: (sources: SourceRepository) =>
        new UpdateSourcesUsecase(sources),
    },
    {
      provide: GetSourceUseCase,
      inject: [SOURCE_REPOSITORY],
      useFactory: (sources: SourceRepository) => new GetSourceUseCase(sources),
    },
    {
      provide: DeleteSourceUseCase,
      inject: [SOURCE_REPOSITORY],
      useFactory: (sources: SourceRepository) =>
        new DeleteSourceUseCase(sources),
    },
  ],
  exports: [SOURCE_REPOSITORY],
})
export class SourceModule {}
