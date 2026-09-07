import { ChannelType } from './enums.js';
import { UserProfileDTO } from './user.types.js';

export interface ChannelDTO { 
    id: string;
    name?: string | null;
    description?: string | null;
    type: ChannelType;
    projectTag?: string | null;
    localeTag?: string | null;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    members?: ChannelMemberDTO[];
}

export interface ChannelMemberDTO {
    id: string;
    channelId: string;
    userId: string;
    role: 'admin' | 'member';
    joinedAt: string;
    lastReadAt: string;
    user?: UserProfileDTO;
}

export interface CreateChannelDTO {
    name?: string;
    description?: string;
    type?: ChannelType;
    projectTag?: string; // e.g. "MH-WILDS", "RE-ENGINE"
    localeTag?: string; // e.g. "JA->EN", "EFIGS"
}

export interface CreateDMDTO {
    recipientId: string; // UUID of target contact
}