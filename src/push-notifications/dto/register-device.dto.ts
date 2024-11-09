import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB'
}

export class RegisterDeviceDto {
  @IsNumber()
  userId: number;

  @IsString()
  deviceToken: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;
}