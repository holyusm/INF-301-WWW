import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AdminUpdateCredentialDto } from './dto/admin-update-credential.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getMe(req.user.id);
  }

  /** GET /auth/users — admin/dueno listan las credenciales de todos los usuarios */
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DUENO)
  listCredentials() {
    return this.authService.findAllCredentials();
  }

  /** PUT /auth/users/:userId — admin/dueno editan rol, estado, email o contraseña */
  @Put('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DUENO)
  updateCredential(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateCredentialDto,
  ) {
    return this.authService.adminUpdateCredential(userId, dto);
  }
}
