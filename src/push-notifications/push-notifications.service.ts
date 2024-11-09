import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto';
import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(private prisma: PrismaService) {
    // Firebase initialization
  }

  async sendNotification(dto: SendNotificationDto) {
    try {
      const { title, body, data } = dto;

      // Get all active devices
      const devices = await this.prisma.device.findMany({
        where: {
          isActive: true,
        },
      });

      if (!devices.length) {
        throw new Error('No active devices found');
      }

      // Send to all devices
      const notifications = devices.map(async (device) => {
        const message = {
          notification: {
            title,
            body,
          },
          data: data || {},
          token: device.deviceToken,
        };

        try {
          const response = await admin.messaging().send(message);
          
          // Log notification
          await this.prisma.notification.create({
            data: {
              userId: device.userId,
              title,
              body,
              data: data || {},
              status: 'SENT',
              messageId: response,
            },
          });

          return { success: true, deviceId: device.id, messageId: response };
        } catch (error) {
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            await this.deactivateDevice(device.userId, device.deviceToken);
          }
          return { success: false, deviceId: device.id, error: error.message };
        }
      });

      const results = await Promise.all(notifications);

      return {
        success: true,
        message: 'Notifications processed',
        totalDevices: devices.length,
        results,
      };
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  async deactivateDevice(userId: number, deviceToken: string) {
    return this.prisma.device.update({
      where: {
        userId_deviceToken: {
          userId,
          deviceToken,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  async getNotificationHistory(
    userId: number,
    page = 1,
    limit = 10,
    type?: NotificationType,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
          ...(type && { type }),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          ...(type && { type }),
        },
      }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  }

  // ... rest of the service methods
}