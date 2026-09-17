import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GetUnreadNotificationsCountUseCase } from "../../application/use-cases/notifications/get-unread-notifications-count.usecase.js";
import { ListNotificationsUseCase } from "../../application/use-cases/notifications/list-notifications.usecase.js";
import { MarkAllNotificationsAsReadUseCase } from "../../application/use-cases/notifications/mark-all-notifications-as-read.usecase.js";
import { MarkNotificationAsReadUseCase } from "../../application/use-cases/notifications/mark-notification-as-read.usecase.js";
import { success } from "../../common/utils/response.dto.js";
import type { Response } from "../../common/utils/response.dto.js";
import type { PaginatedNotifications } from "../../domain/ports/repositories/notification.repository.js";
import type { AuthTokenPayload } from "../../domain/ports/services/auth-token.service.js";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import { ListNotificationsQueryDto } from "../dto/notification.dto.js";
import { JwtAuthGuard } from "../guards/jwt-auth.guard.js";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly getUnreadNotificationsCountUseCase: GetUnreadNotificationsCountUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllNotificationsAsReadUseCase: MarkAllNotificationsAsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List current user's notifications" })
  async findAll(
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<Response<PaginatedNotifications>> {
    const notifications = await this.listNotificationsUseCase.execute(
      user.userId,
      {
        page: query.page,
        pageSize: query.page_size,
        unread: query.unread,
      },
    );
    return success(notifications, true, "Notifications found successfully");
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Count unread notifications" })
  async unreadCount(
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<Response<{ count: number }>> {
    const result = await this.getUnreadNotificationsCountUseCase.execute(
      user.userId,
    );
    return success(result, true, "Unread notifications counted successfully");
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllAsRead(
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<Response<{ count: number }>> {
    const result = await this.markAllNotificationsAsReadUseCase.execute(
      user.userId,
    );
    return success(result, true, "Notifications marked as read successfully");
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark a notification as read" })
  markAsRead(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
  ): Promise<void> {
    return this.markNotificationAsReadUseCase.execute(user.userId, id);
  }
}
