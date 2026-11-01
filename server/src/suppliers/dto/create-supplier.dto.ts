import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
