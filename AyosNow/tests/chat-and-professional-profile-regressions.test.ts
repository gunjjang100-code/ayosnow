import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("chat polling refreshes data without replacing the conversation list with a loading state", () => {
  const chatWorkspace = readSource("src/components/chat/chat-workspace.tsx");

  assert.match(chatWorkspace, /loadConversationsInEffect\(true\)/);
  assert.match(chatWorkspace, /setInterval\([\s\S]*loadConversationsInEffect\(false\)/);
  assert.match(chatWorkspace, /refreshConversations\(\{ showLoading: false \}\)/);
  assert.match(chatWorkspace, /conversationListRequestSeqRef/);
  assert.match(chatWorkspace, /hasSameSnapshot\(current, nextConversations\)/);
  assert.match(chatWorkspace, /hasUnreadIncomingMessage/);
});

test("quote cards use the stable professional user ID for profile links", () => {
  const quoteService = readSource("src/lib/quotes/service.ts");

  assert.match(quoteService, /tradesmanSlug: quote\.tradesman\.id/);
  assert.doesNotMatch(
    quoteService,
    /tradesmanSlug: quote\.tradesman\.fullName\.toLowerCase\(\)/,
  );
});

test("old name-based professional profile links remain supported", () => {
  const profileService = readSource("src/lib/tradesmen/tradesman-profile-service.ts");

  assert.match(profileService, /slugify\(candidate\.fullName\) === slug/);
  assert.match(profileService, /isVerified: true/);
  assert.match(profileService, /isPublished: true/);
});
