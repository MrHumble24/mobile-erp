import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeviceModelDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
