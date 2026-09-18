import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service.js';
import { safeUserSelect } from '../users/users.service.js';
import { ChannelType } from '@capsloc/types';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { AddChannelMemberDto } from './dto/add-channel-member.dto.js';
import { UpdateChannelDto } from './dto/update-channel.dto.js';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /*
    Resolves all channel IDs accessible to a user (public project channels + enrolled memberships)
    */
  async findUserAccessibleChannelIds(userId: string): Promise<string[]> {
    const channels = await this.prisma.channel.findMany({
      where: {
        OR: [
          { type: ChannelType.PUBLIC_PROJECT },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });
    return channels.map((c) => c.id);
  }

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
  async getMembers(channelId: string, callerId: string) {
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
        throw new ForbiddenException(
          'Access denied to members list for this private channel',
        );
      }
    }

    return this.prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: { select: safeUserSelect },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
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

  /*
    Mark channel as read: updates lastReadAt timestamp for the caller on this channel.
    Upserts channelMember if caller was browsing a public channel they hadn't formally joined.
  */
  async markAsRead(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const now = new Date();
    const updatedMember = await this.prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId, userId },
      },
      update: {
        lastReadAt: now,
      },
      create: {
        channelId,
        userId,
        role: 'member',
        lastReadAt: now,
      },
    });

    return {
      channelId,
      userId,
      lastReadAt: updatedMember.lastReadAt.toISOString(),
    };
  }

  /*
    Compute unread message and mention counters across all channels for caller.
    Compares message.createdAt against caller's channelMember.lastReadAt.
  */
  async getUnreadSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberships = await this.prisma.channelMember.findMany({
      where: { userId },
      select: {
        channelId: true,
        lastReadAt: true,
      },
    });

    const unreadCounts: Record<string, number> = {};
    const mentionCounts: Record<string, number> = {};

    await Promise.all(
      memberships.map(async (m) => {
        const [unread, mentions] = await Promise.all([
          this.prisma.message.count({
            where: {
              channelId: m.channelId,
              createdAt: { gt: m.lastReadAt },
              senderId: { not: userId },
            },
          }),
          this.prisma.message.count({
            where: {
              channelId: m.channelId,
              createdAt: { gt: m.lastReadAt },
              senderId: { not: userId },
              content: {
                contains: `@${user.username}`,
                mode: 'insensitive',
              },
            },
          }),
        ]);

        if (unread > 0) {
          unreadCounts[m.channelId] = unread;
        }
        if (mentions > 0) {
          mentionCounts[m.channelId] = mentions;
        }
      }),
    );

    return {
      unreadCounts,
      mentionCounts,
    };
  }

  /*
    Update channel metadata (sprint status, description, name).
    Requires caller to be channel admin (creator or admin role member).
    Cannot update direct message channels.
  */
  async update(channelId: string, callerId: string, dto: UpdateChannelDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type === ChannelType.DIRECT_MESSAGE) {
      throw new BadRequestException(
        'Direct message channels do not support sprint status or metadata edits',
      );
    }

    const isCreator = channel.createdById === callerId;
    const isAdmin = channel.members.some(
      (m) => m.userId === callerId && m.role === 'admin',
    );

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException(
        'Only channel admins can edit channel sprint status or metadata',
      );
    }

    const updated = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status:
          dto.status !== undefined ? dto.status.trim() || null : undefined,
        description:
          dto.description !== undefined
            ? dto.description.trim() || null
            : undefined,
        name: dto.name !== undefined ? dto.name.trim() || undefined : undefined,
      },
      include: {
        members: {
          include: {
            user: { select: safeUserSelect },
          },
        },
      },
    });

    // Decoupled Domain Event: Broadcasts to in-memory listeners
    this.eventEmitter.emit('channel.updated', updated);

    return updated;
  }
}
