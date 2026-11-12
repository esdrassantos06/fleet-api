import {
  Body,
  Controller,
  HttpCode,
  Post,
  Get,
  Request as NestRequest,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { type Request } from 'express';
import { User } from 'src/users/entities/user.entity';
import { JwtGuard } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user: Omit<User, 'passwordHash'>;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: CreateUserDTO) {
    return await this.authService.register(data);
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  login(@NestRequest() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  @HttpCode(200)
  getProfile(@NestRequest() req: Request) {
    return req.user;
  }
}
