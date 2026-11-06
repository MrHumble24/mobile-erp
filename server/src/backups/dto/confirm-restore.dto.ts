import { IsString, MinLength } from 'class-validator';

/** Both are re-checked server-side before anything is touched. */
export class ConfirmRestoreDto {
  /** The shop's name, typed exactly, as a deliberate second confirmation. */
  @IsString()
  shopName!: string;

  /** The caller's own password, verified again against their account. */
  @IsString()
  @MinLength(1)
  password!: string;
}
