import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { LoginUseCase } from "../../application/use-cases/auth/login.usecase.js";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.usecase.js";
import { ForgotPasswordUseCase } from "../../application/use-cases/auth/forgot-password.usecase.js";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/refresh-token.usecase.js";
import { RegisterUseCase } from "../../application/use-cases/auth/register.usecase.js";
import { ResetPasswordUseCase } from "../../application/use-cases/auth/reset-password.usecase.js";
import { AuthSession } from "../../application/use-cases/auth/auth-session.js";
import {
  CreateUserDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from "../dto/user.dto.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register a user" })
  async register(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.registerUseCase.execute(createUserDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate a user" })
  login(@Body() loginDto: LoginDto): Promise<AuthSession> {
    return this.loginUseCase.execute(loginDto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate authentication tokens" })
  refresh(@Body() { refreshToken }: RefreshTokenDto): Promise<AuthSession> {
    return this.refreshTokenUseCase.execute(refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Invalidate a refresh token" })
  async logout(@Body() { refreshToken }: RefreshTokenDto): Promise<void> {
    await this.logoutUseCase.execute(refreshToken);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request a password reset token" })
  forgotPassword(
    @Body() { email }: ForgotPasswordDto,
  ): Promise<{ resetToken?: string }> {
    return this.forgotPasswordUseCase.execute(email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reset password using a reset token" })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.resetPasswordUseCase.execute(dto);
  }
}
