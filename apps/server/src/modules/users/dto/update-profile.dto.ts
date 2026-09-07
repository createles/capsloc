import { IsString, IsOptional, MinLength, MaxLength, IsArray, IsUrl } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    displayName?: string;

    @IsOptional()
    @IsUrl()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    bio?: string;

    @IsOptional()
    @IsString()
    primaryLocale?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    targetLocales?: string[];

    @IsOptional()
    @IsString()
    status?: string;
}