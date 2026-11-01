import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  telegramChatId?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'closingTime must be "HH:mm"',
  })
  closingTime!: string;

  @IsInt()
  @Min(0)
  defaultWarrantyDays!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  minMarginPercent!: number;

  @IsInt()
  @Min(0)
  lowStockThreshold!: number;
}
