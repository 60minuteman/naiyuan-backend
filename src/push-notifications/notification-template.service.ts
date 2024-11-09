import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto';
import * as Mustache from 'mustache';

@Injectable()
export class NotificationTemplateService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: dto,
    });
  }

  async renderTemplate(templateName: string, variables: Record<string, any>) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name: templateName },
    });

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    return {
      title: Mustache.render(template.title, variables),
      body: Mustache.render(template.body, variables),
      type: template.type,
    };
  }
}