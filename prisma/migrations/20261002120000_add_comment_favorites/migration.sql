-- AlterTable
ALTER TABLE "favorites" ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "favorites" ADD COLUMN "commentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_commentId_key" ON "favorites"("userId", "commentId");

-- CreateIndex
CREATE INDEX "favorites_commentId_idx" ON "favorites"("commentId");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
