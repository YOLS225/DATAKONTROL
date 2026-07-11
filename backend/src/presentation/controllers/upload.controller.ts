import { Readable } from "node:stream";
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UnsupportedMediaTypeException,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from "@nestjs/swagger";
import { SaveFileUseCase } from "../../application/use-cases/uploads/save-file.usecase.js";
import { GetUploadUseCase } from "../../application/use-cases/uploads/get-upload.usecase.js";
import { GetUploadsUseCase } from "../../application/use-cases/uploads/get-uploads.usecase.js";
import { GetUploadFileUseCase } from "../../application/use-cases/uploads/get-upload-file.usecase.js";
import { GetValidUploadRowsUseCase } from "../../application/use-cases/uploads/get-valid-upload-rows.usecase.js";
import { GetValidationErrorsUseCase } from "../../application/use-cases/uploads/get-validation-errors.usecase.js";
import { success } from "../../common/utils/response.dto.js";
import type { Response } from "../../common/utils/response.dto.js";
import type { Upload } from "../../domain/entities/upload.entity.js";
import type { PaginatedUploads } from "../../domain/ports/repositories/upload.repository.js";
import type { PaginatedValidationErrors } from "../../domain/ports/repositories/validation-error.repository.js";
import type { AuthTokenPayload } from "../../domain/ports/services/auth-token.service.js";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";
import { ListUploadsQueryDto, PaginationQueryDto } from "../dto/upload.dto.js";
import type { Response as ExpressResponse } from "express";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const FILE_MIME_TYPES: Record<string, Set<string>> = {
  csv: new Set(["text/csv", "application/csv", "application/vnd.ms-excel"]),
  xls: new Set([
    "application/vnd.ms-excel",
    "application/xls",
    "application/x-excel",
    "application/octet-stream",
  ]),
  xlsx: new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/octet-stream",
  ]),
};

interface UploadedTabularFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller("source/:sourceId/uploads")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(
    private readonly saveFileUseCase: SaveFileUseCase,
    private readonly getUploadsUseCase: GetUploadsUseCase,
    private readonly getUploadUseCase: GetUploadUseCase,
    private readonly getUploadFileUseCase: GetUploadFileUseCase,
    private readonly getValidUploadRowsUseCase: GetValidUploadRowsUseCase,
    private readonly getValidationErrorsUseCase: GetValidationErrorsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
      fileFilter: (_request, file, callback) => {
        const extension = file.originalname.toLowerCase().split(".").pop();
        const isSupported =
          extension !== undefined &&
          FILE_MIME_TYPES[extension]?.has(file.mimetype) === true;
        callback(
          isSupported
            ? null
            : new UnsupportedMediaTypeException(
                "Only CSV, XLS and XLSX files are supported",
              ),
          isSupported,
        );
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOperation({ summary: "Upload a CSV or Excel file for a source" })
  async upload(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @UploadedFile() file?: UploadedTabularFile,
  ): Promise<Response<Upload>> {
    if (!file) {
      throw new BadRequestException("A CSV, XLS or XLSX file is required");
    }

    const upload = await this.saveFileUseCase.execute({
      userId: user.userId,
      sourceId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      stream: Readable.from([file.buffer]),
    });

    return success(upload, true, "File accepted for validation");
  }

  @Get()
  @ApiOperation({ summary: "List a source's uploads" })
  async findAll(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Query() query: ListUploadsQueryDto,
  ): Promise<Response<PaginatedUploads>> {
    const uploads = await this.getUploadsUseCase.execute(
      user.userId,
      sourceId,
      {
        page: query.page,
        pageSize: query.page_size,
        search: query.search,
      },
    );
    return success(uploads, true, "Uploads found successfully");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an upload and its validation status" })
  async findOne(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
  ): Promise<Response<Upload>> {
    const upload = await this.getUploadUseCase.execute(
      user.userId,
      sourceId,
      id,
    );
    return success(upload, true, "Upload found successfully");
  }

  @Get(":id/file")
  @ApiOperation({ summary: "Read an uploaded file" })
  async readFile(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<StreamableFile> {
    const file = await this.getUploadFileUseCase.execute(
      user.userId,
      sourceId,
      id,
    );

    response.setHeader("Content-Type", file.fileType);
    response.setHeader("Content-Length", file.fileSize.toString());
    response.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );

    return new StreamableFile(file.stream);
  }

  @Get(":id/errors")
  @ApiOperation({ summary: "List an upload's validation errors" })
  async findErrors(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<Response<PaginatedValidationErrors>> {
    const errors = await this.getValidationErrorsUseCase.execute(
      user.userId,
      sourceId,
      id,
      { page: query.page, pageSize: query.page_size },
    );
    return success(errors, true, "Validation errors found successfully");
  }

  @Get(":id/valid-rows")
  @ApiOperation({ summary: "Download valid rows as CSV" })
  async downloadValidRows(
    @CurrentUser() user: AuthTokenPayload,
    @Param("sourceId") sourceId: string,
    @Param("id") id: string,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<StreamableFile> {
    const file = await this.getValidUploadRowsUseCase.execute(
      user.userId,
      sourceId,
      id,
    );

    response.setHeader("Content-Type", file.fileType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );

    return new StreamableFile(file.stream);
  }
}
