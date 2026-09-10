-- CreateEnum
CREATE TYPE "LocRole" AS ENUM ('TRANSLATOR', 'LQA_TESTER', 'SOLUTIONS_DEV', 'LOC_PM', 'AUDIO_SPECIALIST', 'GENERAL_USER');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('PUBLIC_PROJECT', 'PRIVATE_LOCALE', 'DIRECT_MESSAGE', 'GROUP_DM');

-- CreateEnum
CREATE TYPE "StringStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'LQA_FLAGGED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'SCREENSHOT_BUG', 'DOCUMENT', 'LOG_FILE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "locRole" "LocRole" NOT NULL DEFAULT 'GENERAL_USER',
    "primaryLocale" TEXT NOT NULL DEFAULT 'en-US',
    "targetLocales" TEXT[] DEFAULT ARRAY['ja-JP']::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'offline',
    "hashedRefreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "type" "ChannelType" NOT NULL DEFAULT 'PUBLIC_PROJECT',
    "projectTag" TEXT,
    "localeTag" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_members" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "AttachmentType" NOT NULL DEFAULT 'IMAGE',
    "fileSize" INTEGER NOT NULL,
    "localeTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loc_strings" (
    "id" TEXT NOT NULL,
    "stringKey" TEXT NOT NULL,
    "projectTag" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "targetLocale" TEXT NOT NULL,
    "targetText" TEXT,
    "charLimit" INTEGER,
    "contextNotes" TEXT,
    "status" "StringStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loc_strings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loc_string_refs" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "locStringId" TEXT NOT NULL,

    CONSTRAINT "loc_string_refs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glossary_terms" (
    "id" TEXT NOT NULL,
    "termKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceJa" TEXT NOT NULL,
    "targetEn" TEXT NOT NULL,
    "notes" TEXT,
    "projectTag" TEXT NOT NULL DEFAULT 'GLOBAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glossary_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "channel_members_channelId_userId_key" ON "channel_members"("channelId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "loc_strings_stringKey_key" ON "loc_strings"("stringKey");

-- CreateIndex
CREATE UNIQUE INDEX "loc_string_refs_messageId_locStringId_key" ON "loc_string_refs"("messageId", "locStringId");

-- CreateIndex
CREATE UNIQUE INDEX "glossary_terms_termKey_key" ON "glossary_terms"("termKey");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loc_string_refs" ADD CONSTRAINT "loc_string_refs_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loc_string_refs" ADD CONSTRAINT "loc_string_refs_locStringId_fkey" FOREIGN KEY ("locStringId") REFERENCES "loc_strings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
