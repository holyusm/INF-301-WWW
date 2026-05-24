import { IsUUID, IsString, IsNumber, IsInt, Min, IsPositive } from 'class-validator';

export class AddItemDto {
  @IsUUID()
  productId: string;

  @IsString()
  productName: string;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
