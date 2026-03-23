ALTER TABLE "ProjectEmailRecipient"
ADD COLUMN "userId" TEXT;

ALTER TABLE "ProjectEmailRecipient"
ADD CONSTRAINT "ProjectEmailRecipient_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ProjectEmailRecipient_projectId_userId_key"
ON "ProjectEmailRecipient"("projectId", "userId");
