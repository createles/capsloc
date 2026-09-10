import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { LocRole } from '../../../generated/prisma/enums.js';

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(64)
    password: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    displayName: string;

    @IsOptional()
    @IsEnum(LocRole)
    locRole?: LocRole;

    @IsOptional()
    @IsString()
    primaryLocale?: string;
}