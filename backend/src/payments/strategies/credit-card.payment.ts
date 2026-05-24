import { PaymentMethod, PaymentResult } from './payment-method.abstract';

export class CreditCardPayment extends PaymentMethod {
  readonly type = 'tarjeta';

  constructor(
    private readonly maskedCardNumber: string,
    private readonly expiryDate: string,
  ) {
    super();
  }

  validate(): boolean {
    return !!this.maskedCardNumber && !!this.expiryDate;
  }

  async process(amount: number): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `CC-${Date.now()}`,
      message: `Pago con tarjeta de $${amount} procesado correctamente`,
    };
  }
}
