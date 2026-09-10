import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /*
    GET /api/users
    Returns All registeredusers with safeUserSelect projection 
    */
    @Get()
    async findAll() {
        return this.usersService.findAll()
    }

    @Patch('profile')
    async updateProfile(
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(userId, dto);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }
}