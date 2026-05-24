import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** POST /orders — authenticated users create their own order */
  @Post()
  createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  /** GET /orders — admin / cajero / dueno see all orders */
  @Get()
  @Roles(Role.ADMIN, Role.CAJERO, Role.DUENO)
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  /** GET /orders/my — authenticated user sees their own orders */
  @Get('my')
  getMyOrders(@Request() req: any) {
    return this.ordersService.getOrdersByUser(req.user.id);
  }

  /** GET /orders/:id — authenticated user gets a specific order */
  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  /** PATCH /orders/:id/status — update order status with role checks */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: any,
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.role);
  }

  /** DELETE /orders/:id — admin only, order must be PENDIENTE */
  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }
}
