export enum LocRole {
  // Defines Team Roles
  TRANSLATOR = "TRANSLATOR",
  LQA_TESTER = "LQA_TESTER",
  SOLUTIONS_DEV = "SOLUTIONS_DEV",
  LOC_PM = "LOC_PM",
  AUDIO_SPECIALIST = "AUDIO_SPECIALIST",
  GENERAL_USER = "GENERAL_USER",
}

export enum UserStatus {
  // Defines User status pills
  ONLINE = "online",
  AWAY = "away",
  IN_SPRINT = "in_sprint",
  OFFLINE = "offline",
}

export enum ChannelType {
  // Defines channel type
  PUBLIC_PROJECT = "PUBLIC_PROJECT",
  PRIVATE_LOCALE = "PRIVATE_LOCALE",
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
  GROUP_DM = "GROUP_DM",
}

export enum StringStatus {
  // Defines string status in pipeline
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  LQA_FLAGGED = "LQA_FLAGGED",
}

export enum AttachmentType {
  // Defines type of attachment provided
  IMAGE = "IMAGE",
  SCREENSHOT_BUG = "SCREENSHOT_BUG",
  DOCUMENT = "DOCUMENT",
  LOG_FILE = "LOG_FILE",
}

export const ATTACHMENT_TAG_PRESETS = [
  // LQA Defect Categories
  "UI-OVERFLOW",
  "FONT-ISSUE",
  "LINE-BREAK",
  "AUDIO-DESYNC",
  "UNTRANSLATED",
  // Translation & Reference
  "JA-REF",
  "EN-BASE",
  "DEV-NOTE",
  "GLOSSARY-REF",
] as const;

export type AttachmentTagPreset = (typeof ATTACHMENT_TAG_PRESETS)[number];
