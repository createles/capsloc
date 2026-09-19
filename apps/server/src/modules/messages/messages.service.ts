import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { safeUserSelect } from '../users/users.service.js';
import { ChannelType } from '@capsloc/types';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto.js';

export interface MentionNotificationTarget {
  targetUserId: string;
  channelName: string | null;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /*
    Bouncer Check: Verifies channel exists and caller is authorized
    */
  async validateChannelMembership(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Public channels are accessible to all authenticated users;
    // Private/DM channels require explicit membership enrollment
    if (channel.type !== ChannelType.PUBLIC_PROJECT) {
      const isMember = channel.members.some((m) => m.userId === userId); // check if user is in member's list
      if (!isMember) {
        throw new ForbiddenException('Access denied to this channel');
      }
    }

    return channel;
  }

  /*
    Fetch paginated history using cursor bookmark + single-query peek-ahead
    */
  async findByChannel(channelId: string, userId: string, query: GetMessagesQueryDto) {
    await this.validateChannelMembership(channelId, userId);

    const limit = query.limit ?? 50;
    const where: any = { channelId };

    if (query.stringKey) {
      const cleanKey = query.stringKey.replace(/^[#$]/, '');
      where.stringRefs = {
        some: {
          locString: {
            stringKey: cleanKey,
          },
        },
      };
    }

    // Peek-Ahead Trick: Request 1 extra record to test for hasMore without a COUNT(*) query
    const rawMessages = await this.prisma.message.findMany({
      where,
      take: limit + 1,
      skip: query.cursor ? 1 : 0, // Skip the bookmark record itself
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' }, // Newest first when scrolling up backwards
      include: {
        sender: { select: safeUserSelect }, // Exclude password hashes
        attachments: true,
        stringRefs: {
          include: {
            locString: true, // to allow clickable link for localization inspector drawer
          },
        },
      },
    });

    const hasMore = rawMessages.length > limit;
    const messages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
    const nextCursor = hasMore ? (messages[messages.length - 1]?.id ?? null) : null;

    return {
      messages,
      nextCursor,
      hasMore,
    };
  }

  /*
    Persist message and auto-link detected #LOC-XXXX string references
    */
  async create(channelId: string, userId: string, dto: CreateMessageDto) {
    await this.validateChannelMembership(channelId, userId);

    // Smart Highlighter: Scan message text for #LOC-XXXX or $STR_XXXX tags
    const detectedKeys = new Set<string>(dto.stringKeys ?? []);
    const regexMatches = dto.content.match(/#?([A-Z0-9_-]*LOC-[A-Z0-9_-]+|\$STR_[A-Z0-9_]+)/gi);
    if (regexMatches) {
      for (const match of regexMatches) {
        const cleaned = match.replace(/^#/, '');
        detectedKeys.add(cleaned);
      }
    }

    // Query database to resolve matching LocString IDs
    let locStringIds: string[] = [];
    if (detectedKeys.size > 0) {
      const matchedStrings = await this.prisma.locString.findMany({
        where: {
          stringKey: { in: Array.from(detectedKeys) },
        },
        select: { id: true },
      });
      locStringIds = matchedStrings.map((s) => s.id);
    }

    // Atomically insert message with nested stringRefs junction records
    return this.prisma.message.create({
      data: {
        channelId,
        senderId: userId,
        content: dto.content,
        stringRefs:
          locStringIds.length > 0
            ? {
                create: locStringIds.map((locStringId) => ({
                  locStringId,
                })),
              }
            : undefined,
        // if attachments exist, connect via Prisma relation syntax:
        attachments:
          dto.attachmentIds && dto.attachmentIds.length > 0
            ? {
                connect: dto.attachmentIds.map((id) => ({ id })), // attaches the already exisiting records onto this message
              }
            : undefined,
      },
      include: {
        sender: { select: safeUserSelect },
        attachments: true,
        stringRefs: {
          include: {
            locString: true,
          },
        },
      },
    });
  }

  /*
    Scans message content for @username tags, verifies user existence via Prisma,
    queries channel name, and filters out self-mentions.
    Encapsulates data access and user resolution away from transport gateways.
    */
  async resolveMentionTargets(content: string, channelId: string, senderId: string): Promise<MentionNotificationTarget[]> {
    const mentionMatches = content.match(/@([a-zA-Z0-9_.-]+)/g);
    if (!mentionMatches || mentionMatches.length === 0) return [];

    const targetUsernames = Array.from(new Set(mentionMatches.map((m) => m.substring(1).toLowerCase())));

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        name: true,
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!channel) return [];

    const memberUserIds = channel.members.map((m) => m.userId);

    const mentionedUsers = await this.prisma.user.findMany({
      where: {
        id: { in: memberUserIds },
        username: {
          in: targetUsernames,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    return mentionedUsers
      .filter((u) => u.id !== senderId)
      .map((u) => ({
        targetUserId: u.id,
        channelName: channel.name ?? null,
      }));
  }
}
