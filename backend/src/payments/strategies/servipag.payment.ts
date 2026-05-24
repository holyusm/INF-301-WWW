import { PaymentMethod, PaymentResult } from './payment-method.abstract';

export class ServipagPayment extends PaymentMethod {
  readonly type = 'servipag';

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
      transactionId: `SP-${Date.now()}`,
      message: `Pago con Servipag de $${amount} procesado correctamente`,
    };
  }
}
