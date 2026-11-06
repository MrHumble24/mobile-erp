import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProviderConfigDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isTestMode?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIps?: string[];

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class SetProviderSecretDto {
  @IsString()
  secret!: string;
}

export class RefundPaymentDto {
  @IsString()
  reason!: string;
}
