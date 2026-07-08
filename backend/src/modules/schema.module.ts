import { Module } from "@nestjs/common";
import { CreateSchemaUsecase } from "../application/use-cases/schema/create-schema.usecase.js";
import { GetSchemaUseCase } from "../application/use-cases/schema/get-schema.usecase.js";
import { GetSchemasUsecase } from "../application/use-cases/schema/get-schemas.usecase.js";
import { PublishSchemaUseCase } from "../application/use-cases/schema/publish-schema.usecase.js";
import { UpdateSchemaUseCase } from "../application/use-cases/schema/update-schema.usecase.js";
import { DeleteSchemaUseCase } from "../application/use-cases/schema/delete-schema.usecase.js";
import {
  SCHEMA_VERSION_REPOSITORY,
  type SchemaVersionRepository,
} from "../domain/ports/repositories/schema.repository.js";
import {
  SOURCE_REPOSITORY,
  type SourceRepository,
} from "../domain/ports/repositories/source.repository.js";
import { PrismaSchemaRepository } from "../infrastructure/persistence/repositories/schema.repository.js";
import { SchemaController } from "../presentation/controllers/schema.controller.js";
import { SourceModule } from "./source.module.js";
import { UserModule } from "./user.module.js";

@Module({
  imports: [UserModule, SourceModule],
  controllers: [SchemaController],
  providers: [
    {
      provide: SCHEMA_VERSION_REPOSITORY,
      useClass: PrismaSchemaRepository,
    },
    {
      provide: CreateSchemaUsecase,
      inject: [SOURCE_REPOSITORY, SCHEMA_VERSION_REPOSITORY],
      useFactory: (
        sources: SourceRepository,
        schemas: SchemaVersionRepository,
      ) => new CreateSchemaUsecase(sources, schemas),
    },
    {
      provide: GetSchemasUsecase,
      inject: [SOURCE_REPOSITORY, SCHEMA_VERSION_REPOSITORY],
      useFactory: (
        sources: SourceRepository,
        schemas: SchemaVersionRepository,
      ) => new GetSchemasUsecase(sources, schemas),
    },
    {
      provide: GetSchemaUseCase,
      inject: [SOURCE_REPOSITORY, SCHEMA_VERSION_REPOSITORY],
      useFactory: (
        sources: SourceRepository,
        schemas: SchemaVersionRepository,
      ) => new GetSchemaUseCase(sources, schemas),
    },
    {
      provide: UpdateSchemaUseCase,
      inject: [SOURCE_REPOSITORY, SCHEMA_VERSION_REPOSITORY],
      useFactory: (
        sources: SourceRepository,
        schemas: SchemaVersionRepository,
      ) => new UpdateSchemaUseCase(sources, schemas),
    },
    {
      provide: PublishSchemaUseCase,
      inject: [SOURCE_REPOSITORY, SCHEMA_VERSION_REPOSITORY],
      useFactory: (
        sources: SourceRepository,
        schemas: SchemaVersionRepository,
      ) => new PublishSchemaUseCase(sources, schemas),
    },
    {
      provide: DeleteSchemaUseCase,
      inject: [SOURCE_REPOSITORY, SCHEMA_VERSION_REPOSITORY],
      useFactory: (
        sources: SourceRepository,
        schemas: SchemaVersionRepository,
      ) => new DeleteSchemaUseCase(sources, schemas),
    },
  ],
  exports: [SCHEMA_VERSION_REPOSITORY],
})
export class SchemaModule {}
