export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

export abstract class PaymentMethod {
  abstract readonly type: string;

  abstract process(amount: number): Promise<PaymentResult>;

  abstract validate(): boolean;
}
