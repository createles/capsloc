import { IsString, IsOptional, MaxLength } from 'class-validator';
import { type UpdateChannelDTO } from '@capsloc/types';

export class UpdateChannelDto implements UpdateChannelDTO {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    status?: string;
}
