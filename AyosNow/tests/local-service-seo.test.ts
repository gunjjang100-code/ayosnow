import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLocalServiceStructuredData,
  getLocalServicePage,
  getLocalServicePath,
  getLocalServiceStaticParams,
  getRelatedLocalServicePages,
  localServicePages,
} from "../src/lib/local-seo/service-pages.ts";

const expectedPaths = [
  "/pangasinan/electrician",
  "/pangasinan/plumber",
  "/pangasinan/aircon-repair",
  "/pangasinan/cleaning",
  "/pangasinan/appliance-repair",
];

test("publishes only the five approved Pangasinan service pages", () => {
  assert.deepEqual(localServicePages.map(getLocalServicePath), expectedPaths);
  assert.deepEqual(
    getLocalServiceStaticParams(),
    expectedPaths.map((path) => {
      const [, location, service] = path.split("/");
      return { location, service };
    }),
  );
});

test("uses unique, substantial copy and metadata for every local service page", () => {
  const uniqueFields = [
    localServicePages.map((page) => page.metadataTitle),
    localServicePages.map((page) => page.metadataDescription),
    localServicePages.map((page) => page.headline),
    localServicePages.map((page) => page.overview),
    localServicePages.map((page) => page.choosingProfessional),
  ];

  for (const values of uniqueFields) {
    assert.equal(new Set(values).size, localServicePages.length);
  }

  for (const page of localServicePages) {
    assert.ok(page.metadataDescription.length >= 120);
    assert.ok(page.metadataDescription.length <= 165);
    assert.ok(page.overview.length >= 180);
    assert.equal(page.requestTips.length, 3);
    assert.equal(page.faqs.length, 2);
  }
});

test("rejects city and service pairs outside the explicit allowlist", () => {
  assert.equal(getLocalServicePage("pangasinan", "roofing"), undefined);
  assert.equal(getLocalServicePage("manila", "electrician"), undefined);
});

test("builds related links and accurate structured data without naming PuntaGo as the provider", () => {
  const page = localServicePages[0];
  const related = getRelatedLocalServicePages(page);
  const structuredData = buildLocalServiceStructuredData(page);
  const graph = structuredData["@graph"];
  const breadcrumb = graph.find((item) => item["@type"] === "BreadcrumbList");
  const collectionPage = graph.find((item) => item["@type"] === "CollectionPage");
  const service = graph.find((item) => item["@type"] === "Service");

  assert.equal(related.length, 4);
  assert.ok(related.every((item) => item.service.slug !== page.service.slug));
  assert.equal(breadcrumb?.itemListElement?.length, 3);
  assert.equal(collectionPage?.url, "https://puntago.net/pangasinan/electrician");
  assert.equal(service?.areaServed?.name, "Pangasinan");
  assert.equal("provider" in (service ?? {}), false);
});
