import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class ListPartnersQuery {
  @IsOptional()
  @IsString()
  search?: string;

  /** `true`/`false` → only active / only inactive; omitted → all. */
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' ? undefined : value === 'true',
  )
  active?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  overdue?: boolean;
}
