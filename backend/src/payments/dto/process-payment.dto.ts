import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProcessPaymentDto {
  @IsUUID()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsEnum(['tarjeta', 'servipag', 'transferencia'])
  methodType: 'tarjeta' | 'servipag' | 'transferencia';

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;
}
