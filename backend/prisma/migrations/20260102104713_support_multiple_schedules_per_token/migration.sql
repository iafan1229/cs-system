-- CreateTable
CREATE TABLE "access_token_schedules" (
    "id" SERIAL NOT NULL,
    "accessTokenId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_token_schedules_pkey" PRIMARY KEY ("id")
);

-- 기존 access_tokens의 scheduleId를 access_token_schedules로 마이그레이션
INSERT INTO "access_token_schedules" ("accessTokenId", "scheduleId", "createdAt")
SELECT id, "scheduleId", "createdAt"
FROM "access_tokens"
WHERE "scheduleId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "access_token_schedules_accessTokenId_scheduleId_key" ON "access_token_schedules"("accessTokenId", "scheduleId");

-- CreateIndex
CREATE INDEX "access_token_schedules_accessTokenId_idx" ON "access_token_schedules"("accessTokenId");

-- CreateIndex
CREATE INDEX "access_token_schedules_scheduleId_idx" ON "access_token_schedules"("scheduleId");

-- AddForeignKey
ALTER TABLE "access_token_schedules" ADD CONSTRAINT "access_token_schedules_accessTokenId_fkey" FOREIGN KEY ("accessTokenId") REFERENCES "access_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_token_schedules" ADD CONSTRAINT "access_token_schedules_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "access_tokens" DROP CONSTRAINT IF EXISTS "access_tokens_scheduleId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "access_tokens_scheduleId_idx";

-- AlterTable
ALTER TABLE "access_tokens" DROP COLUMN "scheduleId";

