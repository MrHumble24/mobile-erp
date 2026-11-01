import {
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateStockAlertRuleDto {
  @IsUUID()
  modelId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  storage!: string;

  @IsInt()
  @Min(0)
  threshold!: number;
}
