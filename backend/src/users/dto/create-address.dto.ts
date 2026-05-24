import { IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  label: string;

  @IsString()
  address: string;

  @IsString()
  commune: string;
}
