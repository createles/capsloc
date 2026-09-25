-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "customStatus" TEXT;

-- AlterTable
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "status" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "loc_string_audits" (
    "id" TEXT NOT NULL,
    "locStringId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldStatus" "StringStatus" NOT NULL,
    "newStatus" "StringStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loc_string_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "loc_string_audits_locStringId_createdAt_idx" ON "loc_string_audits"("locStringId", "createdAt" DESC);

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'loc_string_audits_locStringId_fkey'
    ) THEN
        ALTER TABLE "loc_string_audits" ADD CONSTRAINT "loc_string_audits_locStringId_fkey" FOREIGN KEY ("locStringId") REFERENCES "loc_strings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'loc_string_audits_userId_fkey'
    ) THEN
        ALTER TABLE "loc_string_audits" ADD CONSTRAINT "loc_string_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
