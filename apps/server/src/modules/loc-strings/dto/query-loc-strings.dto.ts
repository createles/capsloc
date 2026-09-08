import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { StringStatus, type LocStringFilterQueryDTO } from '@capsloc/types';

/**
 * Validates and transforms query parameters for listing/filtering localization strings (e.g. ?projectTag=MH-WILDS)
 * Query string parameters arrive as raw strings; @Type(() => Number) handles runtime transformation
 */
export class QueryLocStringsDto implements LocStringFilterQueryDTO {
    @IsOptional()
    @IsString()
    projectTag?: string;

    @IsOptional()
    @IsEnum(StringStatus, {
        message: `status must be one of: ${Object.values(StringStatus).join(', ')}`, // Modifies default error message
    })
    status?: StringStatus;

    @IsOptional()
    @IsString()
    targetLocale?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}