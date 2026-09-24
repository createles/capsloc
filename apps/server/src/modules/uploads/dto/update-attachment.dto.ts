import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAttachmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  localeTag?: string;
}
