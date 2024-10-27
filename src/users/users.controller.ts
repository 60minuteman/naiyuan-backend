import { Controller, Post, Body, Param, UseGuards, Get, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete-profile')
  async completeProfile(@Param('id') id: string, @Body() profileData: any) {
    return this.usersService.completeProfile(+id, profileData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req) {
    const userId = req.user.userId;
    return this.usersService.findById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(parseInt(id, 10));
  }
}
