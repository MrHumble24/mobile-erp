import { IsOptional, IsUUID } from 'class-validator';

export class HoldStorefrontOrderDto {
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}
