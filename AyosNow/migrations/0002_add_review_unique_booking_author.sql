CREATE UNIQUE INDEX IF NOT EXISTS "Review_bookingId_authorId_key" ON "Review"("bookingId", "authorId");
