import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

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
