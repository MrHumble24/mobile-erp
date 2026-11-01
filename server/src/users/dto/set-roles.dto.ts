import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class SetRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleCodes!: string[];
}
