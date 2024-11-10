import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { SendNotificationDto, RegisterDeviceDto } from './dto';

@Controller('notifications')
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  @Post('register-device')
  async registerDevice(@Body() dto: RegisterDeviceDto) {
    return this.pushNotificationsService.registerDevice(dto.userId, dto);
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.pushNotificationsService.sendNotification(dto);
  }
}