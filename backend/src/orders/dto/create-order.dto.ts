import {
  IsArray,
  IsNumber,
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
}
