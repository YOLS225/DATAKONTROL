import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CreateSchemaUsecase } from "../../application/use-cases/schema/create-schema.usecase.js";
import { GetSchemaUseCase } from "../../application/use-cases/schema/get-schema.usecase.js";
import { GetSchemasUsecase } from "../../application/use-cases/schema/get-schemas.usecase.js";
import { PublishSchemaUseCase } from "../../application/use-cases/schema/publish-schema.usecase.js";
import { UpdateSchemaUseCase } from "../../application/use-cases/schema/update-schema.usecase.js";
import { DeleteSchemaUseCase } from "../../application/use-cases/schema/delete-schema.usecase.js";
import { DuplicateSchemaUseCase } from "../../application/use-cases/schema/duplicate-schema.usecase.js";
import { success } from "../../common/utils/response.dto.js";
import type { Response } from "../../common/utils/response.dto.js";
import type { SchemaVersion } from "../../domain/entities/schema.entity.js";
import type { PaginatedSchemaVersions } from "../../domain/ports/repositories/schema.repository.js";
import type { AuthTokenPayload } from "../../domain/ports/services/auth-token.service.js";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import {
  CreateSchemaDto,
  ListSchemaVersionsQueryDto,
  UpdateSchemaDto,
} from "../dto/schema.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";

@Controller("source/:sourceId/schema-versions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchemaController {
  constructor(
    private readonly createSchemaUsecase: CreateSchemaUsecase,
    private readonly getSchemasUsecase: GetSchemasUsecase,
    private readonly getSchemaUseCase: GetSchemaUseCase,
    private readonly updateSchemaUseCase: UpdateSchemaUseCase,
    private readonly duplicateSchemaUseCase: DuplicateSchemaUseCase,
    private readonly publishSchemaUseCase: PublishSchemaUseCase,
    private readonly deleteSchemaUseCase: DeleteSchemaUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a schema draft" })
  async create(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Body() dto: CreateSchemaDto,
  ): Promise<Response<SchemaVersion>> {
    const schema = await this.createSchemaUsecase.execute(
      user.userId,
      sourceId,
      dto.schemaDefinition,
    );
    return success(schema, true, "Schema draft created successfully");
  }

  @Get()
  @ApiOperation({ summary: "List a source's schema versions" })
  async findAll(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Query() query: ListSchemaVersionsQueryDto,
  ): Promise<Response<PaginatedSchemaVersions>> {
    const schemas = await this.getSchemasUsecase.execute(
      user.userId,
      sourceId,
      { page: query.page, pageSize: query.page_size },
    );
    return success(schemas, true, "Schema versions found successfully");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a source's schema version" })
  async findOne(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
  ): Promise<Response<SchemaVersion>> {
    const schema = await this.getSchemaUseCase.execute(
      user.userId,
      sourceId,
      id,
    );
    return success(schema, true, "Schema version found successfully");
  }

  @Patch(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Update a schema draft" })
  update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
    @Body() dto: UpdateSchemaDto,
  ): Promise<void> {
    return this.updateSchemaUseCase.execute(
      user.userId,
      sourceId,
      id,
      dto.schemaDefinition,
    );
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Publish a schema draft" })
  publish(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
  ): Promise<void> {
    return this.publishSchemaUseCase.execute(user.userId, sourceId, id);
  }

  @Post(":id/duplicate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Duplicate a schema version as a draft" })
  async duplicate(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
  ): Promise<Response<SchemaVersion>> {
    const schema = await this.duplicateSchemaUseCase.execute(
      user.userId,
      sourceId,
      id,
    );
    return success(schema, true, "Schema draft duplicated successfully");
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an unpublished schema draft" })
  delete(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
  ): Promise<void> {
    return this.deleteSchemaUseCase.execute(user.userId, sourceId, id);
  }
}
