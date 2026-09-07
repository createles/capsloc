import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ChannelType, type CreateChannelDTO } from '@capsloc/types';

export class CreateChannelDto implements CreateChannelDTO {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    description?: string;

    @IsOptional()
    @IsEnum(ChannelType)
    type?: ChannelType;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    projectTag?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    localeTag?: string;
}