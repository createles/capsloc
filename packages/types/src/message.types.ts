import { AttachmentType } from './enums.js';
import { UserProfileDTO } from './user.types.js';
import { LocStringDTO } from './loc-string.types.js';

export interface AttachmentDTO {
    id: string;
    messageId: string;
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