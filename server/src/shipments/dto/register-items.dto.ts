import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  IsUUID,
  Max,
  ValidateNested,
} from 'class-validator';

/** One quantity purchase line: N pieces of a QUANTITY product at a unit cost. */
export class PurchaseItemDto {
  @IsUUID()
  modelId!: string;

  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000_000)
  unitCost!: number;
}

export class RegisterItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];
}
