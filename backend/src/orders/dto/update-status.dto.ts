import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order-item.entity';

export class UpdateStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}
