import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateTransferLineDto {
  @IsIn(['UNIT', 'QUANTITY'])
  lineType!: 'UNIT' | 'QUANTITY';

  /** Set when lineType === 'UNIT'. Device ID. */
  @IsOptional()
  @IsString()
  deviceId?: string;

  /** Set when lineType === 'QUANTITY'. Product model ID. */
  @IsOptional()
  @IsString()
  modelId?: string;

  /** Quantity pieces (positive integer) when lineType === 'QUANTITY'. */
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateStockTransferDto {
  @IsString()
  @IsNotEmpty()
  targetStoreId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransferLineDto)
  lines!: CreateTransferLineDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
