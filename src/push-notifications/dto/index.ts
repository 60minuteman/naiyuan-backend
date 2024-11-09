import { IsString, IsNotEmpty, IsEnum, IsObject, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsString()
    @IsNotEmpty()
    title: string;
  
    @IsString()
    @IsNotEmpty()
    body: string;
  
    @IsEnum(NotificationType)
    type: NotificationType;
  
    @IsObject()
    @IsOptional()
    variables?: Record<string, any>;
  }
  
  export class SendNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;
  
    @IsString()
    @IsNotEmpty()
    body: string;
  
    @IsObject()
    @IsOptional()
    data?: Record<string, any>;
  
    @IsObject()
    @IsOptional()
    variables?: Record<string, any>;
  }
  
  export class UpdateNotificationSettingsDto {
    @IsBoolean()
    @IsOptional()
    pushEnabled?: boolean;
  
    @IsBoolean()
    @IsOptional()
    emailEnabled?: boolean;
  
    @IsBoolean()
    @IsOptional()
    transactionalEnabled?: boolean;
  
    @IsBoolean()
    @IsOptional()
    marketingEnabled?: boolean;
  }