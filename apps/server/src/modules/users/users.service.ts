import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

// Reusable safe user projection (omits passwordHash and hashedRefreshToken at SQL query level)
export const safeUserSelect = {
    id: true,
    username: true,
    email: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    locRole: true,
    primaryLocale: true,
    targetLocales: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find all users in directory ordered by username asc
     * Uses safeUserSelect projection
     */
    async findAll() {
        return this.prisma.user.findMany({
            select: safeUserSelect,
            orderBy: { username: 'asc' },
        });
    }

    /**
     * Find a specific user by ID
     * Throws NotFoundException if user doesn't exist
     */
    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: safeUserSelect,
        });
    
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    /**
     * Update the authenticated user's own profile fields
     * Returns updated safe user record
     */
    async updateProfile(userId: string, dto: UpdateProfileDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: safeUserSelect,
        });
    }
}