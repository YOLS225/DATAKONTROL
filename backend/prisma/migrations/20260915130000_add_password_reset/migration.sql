-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordResetTokenHash" TEXT,
ADD COLUMN "passwordResetTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_passwordResetTokenHash_idx" ON "users"("passwordResetTokenHash");
