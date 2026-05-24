import { PaymentMethod, PaymentResult } from './payment-method.abstract';

export class BankTransferPayment extends PaymentMethod {
  readonly type = 'transferencia';

  constructor(
    private readonly bankName: string,
    private readonly accountNumber: string,
  ) {
    super();
  }

  validate(): boolean {
    return !!this.bankName && !!this.accountNumber;
  }

  async process(amount: number): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `BT-${Date.now()}`,
      message: `Transferencia bancaria de $${amount} procesada correctamente`,
    };
  }
}
