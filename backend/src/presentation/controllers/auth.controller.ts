import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { LoginUseCase } from "../../application/use-cases/auth/login.usecase.js";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.usecase.js";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/refresh-token.usecase.js";
import { RegisterUseCase } from "../../application/use-cases/auth/register.usecase.js";
import { AuthSession } from "../../application/use-cases/auth/auth-session.js";
import { CreateUserDto, LoginDto, RefreshTokenDto } from "../dto/user.dto.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
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
}
