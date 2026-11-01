import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDeviceModelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  brand!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
}
