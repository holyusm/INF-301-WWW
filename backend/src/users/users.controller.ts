import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.getUserById(req.user.id);
  }

  @Put('profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('addresses')
  getAddresses(@Request() req: { user: { id: string } }) {
    return this.usersService.getAddresses(req.user.id);
  }

  @Post('addresses')
  addAddress(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.addAddress(req.user.id, dto);
  }

  @Delete('addresses/:id')
  removeAddress(
    @Request() req: { user: { id: string } },
    @Param('id') addressId: string,
  ) {
    return this.usersService.removeAddress(req.user.id, addressId);
  }

  /** GET /users — admin/dueno listan todos los perfiles (panel de administración) */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.DUENO)
  findAll() {
    return this.usersService.findAll();
  }

  /** PUT /users/:id — admin/dueno editan el perfil de cualquier usuario */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.DUENO)
  adminUpdateProfile(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(id, dto);
  }
}
