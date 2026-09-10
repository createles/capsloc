import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, UnauthorizedException, UseGuards, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ) { }

    /* 
    Endpoint: POST /auth/register
    Expected Input: RegisterDto validated payload via @Body()
    HTTP Status: 201 Created (NestJS Default for POST)
    Return: Sanitized User record (excludes passwordHash or hashedRefreshToken)
    */
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    /**
    Endpoint: POST /auth/login
    Expected Input: LoginDto payload via @Body()
    Injected Response: Express Response with { passthrough: true }
    HTTP Status: 200 OK (override NestJS default 201 with @HttpCode)
    Cookie Invariants:
      - Name: 'refreshToken'
      - httpOnly: true (XSS protection)
      - secure: process.env.NODE_ENV === 'production' (HTTPS only in prod)
      - sameSite: 'lax' (CSRF defense)
      - maxAge: 7 * 24 * 60 * 60 * 1000 (7 days)
      - path: '/'
    Return: { accessToken: string, user: SafeUser }
    */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(dto);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        return { accessToken: result.accessToken, user: result.user };
    }

    /**
    Endpoint: POST /auth/refresh
    HTTP Status: 200 OK
    Injected: @Req() req: Request, @Res({ passthrough: true }) res: Response
        Behavior:
          1. Extract refreshToken from req.cookies?.refreshToken
          2. If missing, throw new UnauthorizedException('Refresh token missing')
          3. In try/catch, verify the token using this.jwtService.verifyAsync<JwtPayload>(...)
          4. Await this.authService.refreshTokens(payload.sub, refreshToken)
          5. Stash new refreshToken in cookie on res (7d, httpOnly, sameSite: 'lax', path: '/')
          6. Return { accessToken: tokens.accessToken }
          7. On catch, throw new UnauthorizedException('Invalid or expired refresh token')
    */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'capsloc_super_secret_refresh_key_dev_67890',
            });

            const tokens = await this.authService.refreshTokens(payload.sub, refreshToken);

            // Rotate refresh token cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/',
            })

            return { accessToken: tokens.accessToken }; // Return new access token to client
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    /**
    Endpoint: POST /auth/logout
    HTTP Status: 200 OK
    Injected: @Req() req: Request, @Res({ passthrough: true }) res: Response
    Behavior:
      1. Check if req.cookies?.refreshToken exists
      2. If present, attempt verifyAsync and await this.authService.logout(payload.sub) inside try/catch
      3. Clear cookie: res.clearCookie('refreshToken', { path: '/' })
      4. Return { message: 'Logged out successfully' }
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        if (req.cookies?.refreshToken) {
            try {
                const payload = await this.jwtService.verifyAsync<JwtPayload>(req.cookies.refreshToken, {
                    secret: process.env.JWT_REFRESH_SECRET || 'capsloc_super_secret_refresh_key_dev_67890',
                });
                await this.authService.logout(payload.sub);
            } catch {
                // Ignore errors during logout; user may already be logged out or token invalid
            }
        }

        res.clearCookie('refreshToken', { path: '/' });
        return { message: 'Logged out successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@CurrentUser() user: any) {
        return user;
    }
}

