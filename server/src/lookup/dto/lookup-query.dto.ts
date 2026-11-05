import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** The scanned/typed code. A query param so box codes with a `/` need no path encoding. */
export class LookupQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code!: string;
}
