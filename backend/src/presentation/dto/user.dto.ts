import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "Awa Kouame" })
  @IsString()
  @IsNotEmpty()
  name: string;
  @ApiProperty({ example: "awa@example.com" })
  @IsEmail()
  email: string;
  @ApiProperty({ example: "mot-de-passe-securise", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: "awa@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "mot-de-passe-securise" })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh token returned during authentication" })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "awa@example.com" })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: "Password reset token" })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ example: "nouveau-mot-de-passe", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
