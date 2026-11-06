import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStorefrontOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  statusCode!: string;

  @IsOptional()
  @IsUUID()
  saleId?: string;
}
