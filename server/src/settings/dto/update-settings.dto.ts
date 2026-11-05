import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
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

  // Discounts (Change 7/12, ADR 0034). Optional so an existing settings PUT
  // that omits them leaves the stored values untouched.
  @IsOptional()
  @IsBoolean()
  discountsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  discountPercentAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  discountAmountAllowed?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsNumber({ maxDecimalPlaces: 2 }, { each: true })
  @Min(0, { each: true })
  @Max(100, { each: true })
  discountPresetsPercent?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsNumber({ maxDecimalPlaces: 2 }, { each: true })
  @Min(0, { each: true })
  discountPresetsAmount?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  maxDiscountPercent?: number;

  // Customer credit (Change 6, ADR 0035). Optional so a PUT that omits them
  // leaves the stored values untouched. Off by default.
  @IsOptional()
  @IsBoolean()
  customerCreditEnabled?: boolean;

  /** Default credit ceiling per customer; omit/null = no cap. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  defaultCreditLimit?: number | null;

  // Cashier shifts (Change 11, ADR 0036). Optional so a PUT that omits it
  // leaves the stored value untouched. Off by default.
  @IsOptional()
  @IsBoolean()
  shiftsEnabled?: boolean;

  // Repairs (Change 13, ADR 0040). Optional so a PUT that omits it leaves the
  // stored value untouched. Off by default.
  @IsOptional()
  @IsBoolean()
  repairsEnabled?: boolean;

  // Loyalty bonus points (ADR 0043). Optional so a PUT that omits them leaves
  // the stored values untouched. Off by default.
  @IsOptional()
  @IsBoolean()
  bonusEnabled?: boolean;

  /** Share of money paid returned as points, as a percent. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  bonusEarnPercent?: number;

  /** Largest share of one sale payable with points, as a percent. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  bonusMaxRedeemPercent?: number;

  // Printing switches (ADR 0043). The server only stores the choice. Optional
  // so a PUT that omits them leaves the stored values untouched.
  @IsOptional()
  @IsBoolean()
  receiptPrintingEnabled?: boolean;

  /** Thermal paper width: 58 or 80 mm (default 80). */
  @IsOptional()
  @Type(() => Number)
  @IsIn([58, 80])
  receiptPaperWidthMm?: number;

  @IsOptional()
  @IsBoolean()
  priceTagsEnabled?: boolean;
}
