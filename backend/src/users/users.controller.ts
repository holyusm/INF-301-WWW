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
}
