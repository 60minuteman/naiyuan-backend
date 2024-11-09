import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { SendNotificationDto } from './dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('notifications')
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  async registerDevice(@Body() dto: RegisterDeviceDto) {
    return this.pushNotificationsService.registerDevice(dto.userId, dto);
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.pushNotificationsService.sendNotification(dto);
  }
}