import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CreateSourceDto } from "../dto/source.dto.js";
import { CreateSourceUseCase } from "../../application/use-cases/sources/create-source.usecase.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import type { AuthTokenPayload } from "../../domain/ports/services/auth-token.service.js";

@Controller("source")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SourceController {
  constructor(private readonly sourceService: CreateSourceUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a source" })
  async create(
    @CurrentUser() user: AuthTokenPayload,
    @Body() createSourceDto: CreateSourceDto,
  ): Promise<void> {
    await this.sourceService.execute(user.userId, createSourceDto);
  }
}
