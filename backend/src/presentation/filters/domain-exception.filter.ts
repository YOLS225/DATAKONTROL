import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { ConflictException } from "../../common/exceptions/conflict.js";
import { NotFoundError } from "../../common/exceptions/not_found.js";
import { UnauthorizedError } from "../../common/exceptions/unauthorized.js";

interface HttpResponse {
  status(statusCode: number): HttpResponse;
  json(body: { statusCode: number; message: string }): void;
}

@Catch(ConflictException, NotFoundError, UnauthorizedError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception: ConflictException | NotFoundError | UnauthorizedError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const status = this.getStatus(exception);

    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }

  private getStatus(
    exception: ConflictException | NotFoundError | UnauthorizedError,
  ): HttpStatus {
    if (exception instanceof ConflictException) return HttpStatus.CONFLICT;
    if (exception instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
    return HttpStatus.NOT_FOUND;
  }
}
