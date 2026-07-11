import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public guidance explains customer pricing and professional quote credits", () => {
  const guide = readSource("src/components/guidance/how-it-works-guide.tsx");

  assert.match(guide, /Free for customers/);
  assert.match(guide, /first quotation on each request/i);
  assert.match(guide, /No extra charge/);
  assert.match(guide, /No automatic refund/);
  assert.match(guide, /Submission does not complete/);

  assert.match(guide, /Libre para sa customers/);
  assert.match(guide, /Walang dagdag/);
  assert.match(guide, /Walang auto-refund/);
});

test("how-it-works remains reachable from public and signed-in navigation", () => {
  const header = readSource("src/components/layout/site-header.tsx");
  const roleNavigation = readSource("src/lib/role-ui.ts");
  const footer = readSource("src/components/layout/site-footer.tsx");
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(header, /href: "\/how-it-works"/);
  assert.ok((roleNavigation.match(/href: "\/how-it-works"/g)?.length ?? 0) >= 6);
  assert.match(footer, /href: "\/how-it-works"/);
  assert.match(sitemap, /"\/how-it-works"/);
});

test("promotional videos remain reachable from every navigation surface", () => {
  const header = readSource("src/components/layout/site-header.tsx");
  const roleNavigation = readSource("src/lib/role-ui.ts");
  const footer = readSource("src/components/layout/site-footer.tsx");
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(header, /href: "\/promotional-videos"/);
  assert.ok((roleNavigation.match(/href: "\/promotional-videos"/g)?.length ?? 0) >= 6);
  assert.match(footer, /href: "\/promotional-videos"/);
  assert.match(sitemap, /"\/promotional-videos"/);
});

test("selecting a quote requires confirmation before booking and chat creation", () => {
  const button = readSource("src/components/chat/select-quote-button.tsx");
  const quoteList = readSource("src/app/quotes/page.tsx");
  const requestDetail = readSource("src/app/quote-requests/[id]/page.tsx");

  assert.match(button, /window\.confirm\(selectConfirmLabel\)/);
  assert.match(quoteList, /selectConfirmLabel=\{text\.quotesSelectConfirm\}/);
  assert.match(requestDetail, /selectConfirmLabel=\{text\.quotesSelectConfirm\}/);
});
