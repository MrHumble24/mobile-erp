import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

/** Teach the system which of our products a reference brand+model is. */
export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  refBrand!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refModel!: string;

  @IsUUID()
  modelId!: string;
}
