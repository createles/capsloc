import { IsString, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { type UpdateChannelDTO } from '@capsloc/types';

export class UpdateChannelDto implements UpdateChannelDTO {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(250)
  description?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(100)
  status?: string | null;
}
