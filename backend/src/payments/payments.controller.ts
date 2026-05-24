import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** POST /payments/process — process a payment for an order */
  @Post('process')
  processPayment(@Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(dto);
  }

  /** GET /payments/order/:orderId — get the payment for a specific order */
  @Get('order/:orderId')
  getByOrderId(@Param('orderId') orderId: string) {
    return this.paymentsService.getByOrderId(orderId);
  }
}
