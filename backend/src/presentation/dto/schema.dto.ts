import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import type {
  ColumnFormat,
  ColumnType,
  SchemaDefinition,
} from "../../domain/entities/schema.entity.js";

const COLUMN_TYPES: ColumnType[] = [
  "string",
  "integer",
  "decimal",
  "boolean",
  "date",
  "datetime",
];

const COLUMN_FORMATS: ColumnFormat[] = ["email", "phone", "url"];

export class SchemaColumnConstraintsDto {
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minLength?: number;

  @ApiPropertyOptional({ example: 255 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLength?: number;

  @ApiPropertyOptional({ enum: COLUMN_FORMATS, example: "email" })
  @IsOptional()
  @IsIn(COLUMN_FORMATS)
  format?: ColumnFormat;

  @ApiPropertyOptional({ type: [String], example: ["pending", "paid"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  allowedValues?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional({ example: "2026-01-01" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  minDate?: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  maxDate?: string;
}

export class SchemaColumnDto {
  @ApiProperty({ example: "customer-email" })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: "email" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: COLUMN_TYPES, example: "string" })
  @IsIn(COLUMN_TYPES)
  type: ColumnType;

  @ApiProperty({ example: true })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ type: SchemaColumnConstraintsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SchemaColumnConstraintsDto)
  constraints?: SchemaColumnConstraintsDto;
}

export class SchemaDefinitionDto implements SchemaDefinition {
  @ApiProperty({ type: [SchemaColumnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchemaColumnDto)
  columns: SchemaColumnDto[];
}

export class CreateSchemaDto {
  @ApiPropertyOptional({ type: SchemaDefinitionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SchemaDefinitionDto)
  schemaDefinition?: SchemaDefinitionDto;
}

export class UpdateSchemaDto {
  @ApiProperty({ type: SchemaDefinitionDto })
  @ValidateNested()
  @Type(() => SchemaDefinitionDto)
  schemaDefinition: SchemaDefinitionDto;
}

export class ListSchemaVersionsQueryDto {
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
}
