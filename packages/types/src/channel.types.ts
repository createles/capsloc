import { ChannelType } from "./enums.js";
import { UserProfileDTO } from "./user.types.js";

export interface ChannelDTO {
  id: string;
  name?: string | null;
  description?: string | null;
  status?: string | null; // e.g., "last 2 weeks until 9/20/26 deadline" (Sprint/Milestone state)
  type: ChannelType;
  projectTag?: string | null;
  localeTag?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  members?: ChannelMemberDTO[];
}

export interface UpdateChannelDTO {
  name?: string;
  description?: string;
  status?: string;
}

export interface ChannelMemberDTO {
  id: string;
  channelId: string;
  userId: string;
  role: "admin" | "member";
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

export interface AddChannelMemberDTO {
  userId: string;
  role?: "admin" | "member";
}

export interface UnreadSummaryDTO {
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
}
