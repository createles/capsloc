import { StringStatus } from './enums.js';

export interface LocStringDTO { //
    id: string;
    stringKey: string; // e.g. "LOC-04829"
    projectTag: string; // e.g. "MH-WILDS, RE-9"
    sourceText: string; // Japanese source dialogue
    targetLocale: string; // e.g. "en-US"
    targetText?: string | null;
    charLimit?: number | null;
    contextNotes?: string | null;
    status: StringStatus;
    createdAt: string;
    updatedAt: string;
}

export interface GlossaryTermDTO { // For Localization Inspector
    id: string;
    termKey: string;
    category: 'Character' | 'Weapon' | 'Item' | 'Location' | 'Monster';
    sourceJa: string;
    targetEn: string;
    notes?: string | null;
    projectTag: string;
}