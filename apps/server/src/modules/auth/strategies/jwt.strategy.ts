import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';

export interface JwtPayload {
    sub: string;
    email: string;
    username: string;
    locRole: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_ACCESS_SECRET || 'capsloc_super_secret_access_key_dev_12345',
        });
    }

    // Validate payload and attach safe user object to request.user
    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('User account no longer exists'); // Valid JWT but user account was deleted later
        }

        const { passwordHash: _, hashedRefreshToken: __, ...safeUser } = user;
        return safeUser;
    }
}