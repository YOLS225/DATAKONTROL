import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateSourceDto {
  @ApiProperty({ example: "ODCI-Hebdo" })
  @IsString()
  @IsNotEmpty()
  name: string;
  @ApiProperty({ example: "weekly report" })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateSourceDto extends PartialType(CreateSourceDto) {}

export class ListSourcesQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    name: "page_size",
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size: number = 20;

  @ApiPropertyOptional({ example: "hebdo" })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  search?: string;
}
