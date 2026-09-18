import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service.js';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { CreateDmDto } from './dto/create-dm.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AddChannelMemberDto } from './dto/add-channel-member.dto.js';
import { UpdateChannelDto } from './dto/update-channel.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  /*
    GET /api/channels
    Returns all public channels + enrolled private/DM channels
    */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.channelsService.findAll(userId);
  }

  /*
    POST /api/channels
    Creates a project or locale channel
    */
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.create(userId, dto);
  }

  /*
    POST /api/channels/dm
    Idempotently resolves or provisions a 1-on-1 direct message channel
    Must be declared BEFORE ':id' to prevent routing conflicts
    */
  @Post('dm')
  async findOrCreateDM(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDmDto,
  ) {
    return this.channelsService.findOrCreateDM(userId, dto.recipientId);
  }

  /*
    GET /api/channels/unread/summary
    Returns unread counts and mention counts for caller across all channels
    Must be declared BEFORE ':id' to prevent route conflict
  */
  @Get('unread/summary')
  async getUnreadSummary(@CurrentUser('id') userId: string) {
    return this.channelsService.getUnreadSummary(userId);
  }

  /*
    GET /api/channels/:id
    Returns channel details if user is authorized
    */
  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.channelsService.findById(id, userId);
  }

  /*
    POST /api/channels/:id/read
    Updates lastReadAt for caller on this channel
  */
  @Post(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.markAsRead(id, userId);
  }

  /*
    POST /api/channels/:id/join
    Enrolls user into a public project channel
    */
  @Post(':id/join')
  async join(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.channelsService.join(id, userId);
  }


  /* 
    GET /api/channels/:id/members
    Fetches complete list of channel members for members list
  */
  @Get(':id/members')
  async getMembers(
    @Param('id') channelId: string,
    @CurrentUser('id') callerId: string,
  ) {
    return this.channelsService.getMembers(channelId, callerId);
  }

  /*
    POST /api/channels/:id/members
    Enrolls a user into a channel (admin-only for private channels)
    */
  @Post(':id/members')
  async addMember(
    @Param('id') channelId: string,
    @CurrentUser('id') callerId: string,
    @Body() dto: AddChannelMemberDto,
  ) {
    return this.channelsService.addMember(channelId, callerId, dto);
  }

  /*
    PATCH /api/channels/:id
    Updates channel status or metadata (admin only)
  */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, userId, dto);
  }
}
