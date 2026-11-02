import { Type } from 'class-transformer';
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
  @MaxLength(200)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storeAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  storePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptFooter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telegramChatId?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'closingTime must be "HH:mm"',
  })
  closingTime!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3650)
  defaultWarrantyDays!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  minMarginPercent!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  lowStockThreshold!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3650)
  defaultNasiyaDueDays!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  overdueReminderDays!: number;
}
