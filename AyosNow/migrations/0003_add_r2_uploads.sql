-- User-uploaded files live in Cloudflare R2.
-- The database stores only the object key, a safe app URL, and metadata.

CREATE TABLE IF NOT EXISTS "UploadedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'PRIVATE',
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "Message" ADD COLUMN "imageUploadId" TEXT;
ALTER TABLE "Message" ADD COLUMN "fileUploadId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "UploadedFile_objectKey_key" ON "UploadedFile"("objectKey");
CREATE INDEX IF NOT EXISTS "UploadedFile_uploadedById_createdAt_idx" ON "UploadedFile"("uploadedById", "createdAt");
CREATE INDEX IF NOT EXISTS "UploadedFile_folder_createdAt_idx" ON "UploadedFile"("folder", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Message_imageUploadId_key" ON "Message"("imageUploadId");
CREATE UNIQUE INDEX IF NOT EXISTS "Message_fileUploadId_key" ON "Message"("fileUploadId");
