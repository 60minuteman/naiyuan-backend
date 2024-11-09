import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushNotificationsService } from './push-notifications.service';
import { SendNotificationDto, UpdateNotificationSettingsDto } from './dto';
import { User } from '../decorators/user.decorator';
import { NotificationType } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  @Post('send')
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.pushNotificationsService.sendNotification(dto);
  }

  @Get('history')
  async getNotificationHistory(
    @User('id') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: NotificationType,
  ) {
    return this.pushNotificationsService.getNotificationHistory(
      userId,
      page,
      limit,
      type,
    );
  }
}