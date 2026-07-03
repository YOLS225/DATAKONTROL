import { Module } from "@nestjs/common";
import { AuthController } from "../presentation/controllers/auth.controller.js";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../domain/ports/repositories/user.repository.js";
import { PrismaRegisterRepository } from "../infrastructure/persistence/repositories/register.repository.js";
import { RegisterUseCase } from "../application/use-cases/auth/register.usecase.js";
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from "../domain/ports/services/password-hasher.js";
import { BcryptPasswordHasher } from "../infrastructure/security/bcrypt-password-hasher.js";
import { ConfigService } from "@nestjs/config";
import {
  AUTH_TOKEN_SERVICE,
  AuthTokenService,
} from "../domain/ports/services/auth-token.service.js";
import { JwtTokenService } from "../infrastructure/security/jwt-token.service.js";
import { LoginUseCase } from "../application/use-cases/auth/login.usecase.js";
import { RefreshTokenUseCase } from "../application/use-cases/auth/refresh-token.usecase.js";
import { LogoutUseCase } from "../application/use-cases/auth/logout.usecase.js";
import { JwtAuthGuard } from "../presentation/guards/jwt-auth.guard.js";
import {
  TOKEN_HASHER,
  TokenHasher,
} from "../domain/ports/services/token-hasher.js";
import { Sha256TokenHasher } from "../infrastructure/security/sha256-token-hasher.js";

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaRegisterRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_HASHER,
      useClass: Sha256TokenHasher,
    },
    {
      provide: AUTH_TOKEN_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const fallbackSecret = config.getOrThrow<string>("JWT_SECRET");
        return new JwtTokenService(
          config.get<string>("JWT_ACCESS_SECRET") ?? fallbackSecret,
          config.get<string>("JWT_REFRESH_SECRET") ?? fallbackSecret,
        );
      },
    },
    JwtAuthGuard,
    {
      provide: RegisterUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
      useFactory: (users: UserRepository, passwordHasher: PasswordHasher) =>
        new RegisterUseCase(users, passwordHasher),
    },
    {
      provide: LoginUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        AUTH_TOKEN_SERVICE,
        TOKEN_HASHER,
      ],
      useFactory: (
        users: UserRepository,
        passwordHasher: PasswordHasher,
        tokenService: AuthTokenService,
        tokenHasher: TokenHasher,
      ) => new LoginUseCase(users, passwordHasher, tokenService, tokenHasher),
    },
    {
      provide: RefreshTokenUseCase,
      inject: [USER_REPOSITORY, AUTH_TOKEN_SERVICE, TOKEN_HASHER],
      useFactory: (
        users: UserRepository,
        tokenService: AuthTokenService,
        tokenHasher: TokenHasher,
      ) => new RefreshTokenUseCase(users, tokenService, tokenHasher),
    },
    {
      provide: LogoutUseCase,
      inject: [USER_REPOSITORY, AUTH_TOKEN_SERVICE, TOKEN_HASHER],
      useFactory: (
        users: UserRepository,
        tokenService: AuthTokenService,
        tokenHasher: TokenHasher,
      ) => new LogoutUseCase(users, tokenService, tokenHasher),
    },
  ],
  exports: [USER_REPOSITORY, JwtAuthGuard],
})
export class UserModule {}
