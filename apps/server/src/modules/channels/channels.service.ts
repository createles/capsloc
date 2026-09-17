import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { safeUserSelect } from '../users/users.service.js';
import { ChannelType } from '@capsloc/types';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { AddChannelMemberDto } from './dto/add-channel-member.dto.js';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  /*
    List all public channels + private/DM channels where caller is enrolled
    */
  async findAll(userId: string) {
    return this.prisma.channel.findMany({
      where: {
        OR: [
          { type: ChannelType.PUBLIC_PROJECT },
          { members: { some: { userId } } }, // channels that caller is apart of
        ],
      },
      include: {
        members: {
          include: {
            user: { select: safeUserSelect }, // Include user data sanitized with safeUserSelect select object
          },
        },
        _count: {
          select: { messages: true }, // returns message counts
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /*
    Retrieve single channel details; enforce membership check on non-public channels
    */
  async findById(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: { select: safeUserSelect },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Access check: If channel is not public, user MUST be a member
    if (channel.type !== ChannelType.PUBLIC_PROJECT) {
      const isMember = channel.members.some((m) => m.userId === userId); // check whether user is authorized member of channel
      if (!isMember) {
        throw new ForbiddenException('Access denied to this private channel');
      }
    }

    return channel;
  }

  /*
    Create project or locale channel; creator is atomically enrolled as 'admin'
    */
  async create(userId: string, dto: CreateChannelDto) {
    if (dto.type === ChannelType.DIRECT_MESSAGE) {
      throw new BadRequestException(
        'Use the /channels/dm endpoint to initiate direct messages',
      );
    }

    return this.prisma.channel.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type ?? ChannelType.PUBLIC_PROJECT,
        projectTag: dto.projectTag,
        localeTag: dto.localeTag,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: safeUserSelect },
          },
        },
      },
    });
  }

  /*
    Idempotent direct message channel resolution between two users (ensures calls don't create multiples) 
    */
  async findOrCreateDM(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException(
        'Cannot initiate a direct message channel with yourself',
      );
    }

    // Verify recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // Idempotent search: Find existing DIRECT_MESSAGE containing BOTH members
    const existingDM = await this.prisma.channel.findFirst({
      where: {
        type: ChannelType.DIRECT_MESSAGE,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: safeUserSelect },
          },
        },
      },
    });

    if (existingDM) {
      return existingDM;
    }

    // Atomically provision new DM channel and enroll both participants
    return this.prisma.channel.create({
      data: {
        type: ChannelType.DIRECT_MESSAGE,
        createdById: userId,
        members: {
          create: [
            { userId, role: 'admin' },
            { userId: recipientId, role: 'member' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: safeUserSelect },
          },
        },
      },
    });
  }

  /*
    Join a public project channel
    */
  async join(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type !== ChannelType.PUBLIC_PROJECT) {
      throw new ForbiddenException(
        'Only public project channels can be joined directly',
      );
    }

    // Check if user is already enrolled via composite key
    const existingMember = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
    });

    if (existingMember) {
      return existingMember;
    }

    return this.prisma.channelMember.create({
      data: {
        channelId,
        userId,
        role: 'member',
      },
    });
  }

  /* 
    List all enrolled members of a channel.
    If channel is not public, must be member of channel to view member list.
    */
  async getMembers(
    channelId: string,
    callerId: string,
  ) {
    const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: { members: true },
    });

    if (!channel) {
        throw new NotFoundException('Channel not found');
    }

    if (channel.type !== ChannelType.PUBLIC_PROJECT) {
        const isMember = channel.members.some((m) => m.userId === callerId);
        if (!isMember) {
            throw new ForbiddenException('Access denied to members list for this private channel');
        }
    }

    return this.prisma.channelMember.findMany({
        where: { channelId },
        include: {
            user: { select: safeUserSelect },
        },
        orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' },
        ],
    });
  }

  /*
    Add / invite a teammate into a channel.
    Guarded so that only channel admins can add members to private channels.
    */
  async addMember(
    channelId: string,
    callerId: string,
    dto: AddChannelMemberDto,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type === ChannelType.DIRECT_MESSAGE) {
      throw new BadRequestException(
        'Cannot add members to a direct message channel',
      );
    }

    // Bouncer check: Caller must be admin or creator
    const callerMembership = channel.members.find((m) => m.userId === callerId);
    const isCallerAdmin =
      callerMembership?.role === 'admin' || channel.createdById === callerId;

    if (!isCallerAdmin) {
      throw new ForbiddenException(
        'Only channel admins can invite or add members',
      );
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User to invite not found');
    }

    // Deduplication check: Is user already enrolled?
    const isAlreadyMember = channel.members.some(
      (m) => m.userId === dto.userId,
    );
    if (isAlreadyMember) {
      throw new BadRequestException('User is already a member of this channel');
    }

    return this.prisma.channelMember.create({
      data: {
        channelId,
        userId: dto.userId,
        role: dto.role || 'member',
      },
      include: {
        user: { select: safeUserSelect },
      },
    });
  }
}
