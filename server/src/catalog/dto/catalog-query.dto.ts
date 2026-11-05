import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CatalogQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
