import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ReportsService } from './reports.service';
import { RegisterSaleDto } from './dto/register-sale.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.DUENO)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('current')
  getCurrentWeekReport() {
    return this.reportsService.getCurrentWeekReport();
  }

  @Get('recent')
  getRecentWeeks(
    @Query('n', new DefaultValuePipe(4), ParseIntPipe) n: number,
  ) {
    return this.reportsService.getRecentWeeks(n);
  }

  @Get(':weekId')
  getWeekReport(@Param('weekId') weekId: string) {
    return this.reportsService.getWeekReport(weekId);
  }

  @Post('register-sale')
  registerSale(@Body() dto: RegisterSaleDto) {
    const date = new Date(dto.date + 'T12:00:00Z');
    return this.reportsService.registerSale(dto.amount, date);
  }
}
