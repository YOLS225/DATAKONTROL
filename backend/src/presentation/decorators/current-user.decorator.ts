import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthTokenPayload } from "../../domain/ports/services/auth-token.service.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthTokenPayload => {
    return context.switchToHttp().getRequest<{ user: AuthTokenPayload }>().user;
  },
);
