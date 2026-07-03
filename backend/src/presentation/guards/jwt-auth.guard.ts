import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AUTH_TOKEN_SERVICE } from "../../domain/ports/services/auth-token.service.js";
import type {
  AuthTokenPayload,
  AuthTokenService,
} from "../../domain/ports/services/auth-token.service.js";

interface AuthenticatedRequest {
  headers: { authorization?: string };
  user?: AuthTokenPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly tokenService: AuthTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing or invalid access token");
    }

    const payload = this.tokenService.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException("Missing or invalid access token");
    }

    request.user = payload;
    return true;
  }
}
