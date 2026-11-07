import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LookupSearchQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q!: string;
}
