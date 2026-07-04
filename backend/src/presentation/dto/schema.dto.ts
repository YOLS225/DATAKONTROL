import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import type {
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
