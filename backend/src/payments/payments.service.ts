import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentMethod } from './strategies/payment-method.abstract';
import { CreditCardPayment } from './strategies/credit-card.payment';
import { ServipagPayment } from './strategies/servipag.payment';
import { BankTransferPayment } from './strategies/bank-transfer.payment';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  /**
   * Factory method: creates the concrete PaymentMethod instance
   * based on the methodType field of the DTO.
   */
  buildPaymentMethod(dto: ProcessPaymentDto): PaymentMethod {
    switch (dto.methodType) {
      case 'tarjeta':
        return new CreditCardPayment(
          dto.cardNumber ?? '',
          dto.expiryDate ?? '',
        );
      case 'servipag':
        return new ServipagPayment(dto.cardNumber ?? '', dto.expiryDate ?? '');
      case 'transferencia':
        return new BankTransferPayment(
          dto.bankName ?? '',
          dto.accountNumber ?? '',
        );
      default:
        throw new BadRequestException(
          `Método de pago desconocido: "${(dto as any).methodType}"`,
        );
    }
  }

  /**
   * Main payment processing flow:
   * 1. Build the strategy object
   * 2. Validate — throws BadRequestException on failure
   * 3. Process (async call to the strategy)
   * 4. Persist the result
   * 5. Return the saved Payment entity
   */
  async processPayment(dto: ProcessPaymentDto): Promise<Payment> {
    const method = this.buildPaymentMethod(dto);

    if (!method.validate()) {
      throw new BadRequestException(
        'Los datos del método de pago no son válidos',
      );
    }

    const result = await method.process(dto.amount);

    const payment = this.paymentRepo.create({
      orderId: dto.orderId,
      amount: dto.amount,
      methodType: dto.methodType,
      status: result.success ? PaymentStatus.APROBADO : PaymentStatus.RECHAZADO,
      transactionId: result.transactionId,
      errorMessage: result.success ? null : result.message,
    });

    return this.paymentRepo.save(payment);
  }

  async getByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { orderId } });
    if (!payment) {
      throw new NotFoundException(
        `No se encontró pago para el pedido "${orderId}"`,
      );
    }
    return payment;
  }
}
