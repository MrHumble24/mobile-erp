import { Equals, IsBoolean, IsString, MinLength } from 'class-validator';

/** The confirmation the owner types: shop name, their password, the flags, and
 * an explicit "I understand". The shop name and password are re-checked on the
 * server (never trusted from the client). */
export class WipeRequestDto {
  @IsString()
  @MinLength(1)
  shopName!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  /** Must be exactly `true` — the ticked "I understand this cannot be undone". */
  @Equals(true)
  understood!: boolean;

  @IsBoolean()
  contacts!: boolean;

  @IsBoolean()
  catalog!: boolean;
}
