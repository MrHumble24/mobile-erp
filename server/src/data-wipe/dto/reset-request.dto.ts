import { Equals, IsString, MinLength } from 'class-validator';

/**
 * Factory reset confirmation: shop name, password, the explicit sentence
 * "erase everything", and the understood tick. Re-checked on the server.
 */
export class ResetRequestDto {
  @IsString()
  @MinLength(1)
  shopName!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  /** Must be exactly "erase everything". */
  @Equals('erase everything', {
    message: 'The confirmation sentence must be "erase everything"',
  })
  sentence!: string;

  /** Must be exactly `true` — the ticked "I understand". */
  @Equals(true)
  understood!: boolean;
}
