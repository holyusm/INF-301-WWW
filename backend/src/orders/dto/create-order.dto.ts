import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  productName: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
}

/** Datos del método de pago opcionales al crear el pedido.
 *  Si se incluyen, el pedido se procesa y paga en una sola llamada.
 *  Si se omiten, el pedido queda en estado PENDIENTE para pagar después.
 */
export class InlinePaymentDto {
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

export class CreateOrderDto {
  @IsString()
  deliveryAddress: string;

  @IsString()
  paymentMethod: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  total: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => InlinePaymentDto)
  paymentData?: InlinePaymentDto;
}
