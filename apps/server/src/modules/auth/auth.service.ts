import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    // Register user with unique check, password hashing, and sanitized return
    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { username: dto.username }],
            },
        });

        if (existing) {
            throw new ConflictException('Email or username is already registered');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);

        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                passwordHash,
                displayName: dto.displayName,
                locRole: dto.locRole,
                primaryLocale: dto.primaryLocale || 'en-US',
            },
        });

        // Exclude sensitive fields by destructuring and returning the rest
        const { passwordHash: _, hashedRefreshToken: __, ...safeUser } = user;
        return safeUser;
    }

    // Verify credentials, generate dual tokens, and store hashed refresh token
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.username, user.locRole);
        await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

        const { passwordHash: _, hashedRefreshToken: __, ...safeUser } = user;
        return { ...tokens, user: safeUser };
    }

    // Verify refresh token against bcrypt hash and rotate tokens
    async refreshTokens(userId: string, incomingRefreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.hashedRefreshToken) {
            throw new ForbiddenException('Access denied');
        }

        const isMatch = await bcrypt.compare(incomingRefreshToken, user.hashedRefreshToken);
        if (!isMatch) {
            throw new ForbiddenException('Access denied');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.username, user.locRole);
        await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    // Clear hashedRefreshToken on logout
    async logout(userId: string): Promise<void> {
        await this.prisma.user.updateMany({
            where: { id: userId, hashedRefreshToken: { not: null } },
            data: { hashedRefreshToken: null, status: 'offline' },
        });
    }

    // Generate 15m access token and 7d refresh token
    private async generateTokens(userId: string, email: string, username: string, locRole: string) {
        const payload = { sub: userId, email, username, locRole };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET || 'capsloc_super_secret_access_key_dev_12345',
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET || 'capsloc_super_secret_refresh_key_dev_67890',
                expiresIn: '7d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async updateHashedRefreshToken(userId: string, refreshToken: string): Promise<void> {
        const salt = await bcrypt.genSalt(10);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken, status: 'online' },
        });
    }
}