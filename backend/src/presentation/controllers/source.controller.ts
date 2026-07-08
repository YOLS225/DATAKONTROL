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
import {
  CreateSourceDto,
  ListSourcesQueryDto,
  UpdateSourceDto,
} from "../dto/source.dto.js";
import { CreateSourceUseCase } from "../../application/use-cases/sources/create-source.usecase.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import type { AuthTokenPayload } from "../../domain/ports/services/auth-token.service.js";
import { GetSourcesUsecase } from "../../application/use-cases/sources/get-sources.usecase.js";
import { UpdateSourcesUsecase } from "../../application/use-cases/sources/update-sources.usecase.js";
import {
  GetSourceUseCase,
  type GetSourceResult,
} from "../../application/use-cases/sources/get-source.usecase.js";
import { DeleteSourceUseCase } from "../../application/use-cases/sources/delete-source.usecase.js";
import { success } from "../../common/utils/response.dto.js";
import type { Response } from "../../common/utils/response.dto.js";
import type { PaginatedSources } from "../../domain/ports/repositories/source.repository.js";

@Controller("source")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SourceController {
  constructor(
    private readonly createSourceUseCase: CreateSourceUseCase,
    private readonly getSourcesUsecase: GetSourcesUsecase,
    private readonly getSourceUseCase: GetSourceUseCase,
    private readonly updateSourceUsecase: UpdateSourcesUsecase,
    private readonly deleteSourceUseCase: DeleteSourceUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a source" })
  async create(
    @CurrentUser() user: AuthTokenPayload,
    @Body() createSourceDto: CreateSourceDto,
  ): Promise<void> {
    await this.createSourceUseCase.execute(user.userId, createSourceDto);
  }

  @Get()
  @ApiOperation({ summary: "List the current user's sources" })
  async findAll(
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: ListSourcesQueryDto,
  ): Promise<Response<PaginatedSources>> {
    const sources = await this.getSourcesUsecase.execute(user.userId, {
      page: query.page,
      pageSize: query.page_size,
      search: query.search,
    });
    return success(sources, true, "Sources found successfully");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one of the current user's sources" })
  async findOne(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
  ): Promise<Response<GetSourceResult>> {
    const source = await this.getSourceUseCase.execute(user.userId, id);
    return success(source, true, "Source found successfully");
  }

  @Patch(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Update a source" })
  update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() updateSourceDto: UpdateSourceDto,
  ) {
    return this.updateSourceUsecase.execute(user.userId, id, updateSourceDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an unlinked source" })
  delete(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
  ): Promise<void> {
    return this.deleteSourceUseCase.execute(user.userId, id);
  }
}
