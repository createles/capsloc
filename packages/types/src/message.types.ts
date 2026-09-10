import { AttachmentType } from './enums.js';
import { UserProfileDTO } from './user.types.js';
import { LocStringDTO } from './loc-string.types.js';

export interface AttachmentDTO {
    id: string;
    messageId?: string | null; // messageId is optional/nullable to allow staged file upload prior to message creation
    fileUrl: string;
    fileName: string;
    fileType: AttachmentType;
    fileSize: number;
    localeTag?: string | null; // e.g. "[JA-Ref]", "[DE-Overflow]"
    createdAt: string;
}

export interface MessageDTO {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    sender: UserProfileDTO;
    attachments: AttachmentDTO[];
    stringRefs: LocStringDTO[];
}

// Payload sent by client when creating a message
export interface CreateMessageDTO {
    content: string;
    attachmentIds?: string[];
    stringKeys?: string[];
}

// Query parameters when asking for paginated chat history
export interface GetMessagesQueryDTO {
    cursor?: string;
    limit?: number;
}

// The packet returned to frontend containing the messages and the next bookmark
export interface PaginatedMessagesDTO {
    messages: MessageDTO[];
    nextCursor: string | null;
    hasMore: boolean;
}