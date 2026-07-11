import assert from "node:assert/strict";
import test from "node:test";

import {
  buildYouTubeEmbedUrl,
  promotionalVideoSettingsUpdateSchema,
} from "../src/lib/validations/promotional-videos.ts";

const VIDEO_ID_1 = "dQw4w9WgXcQ";
const VIDEO_ID_2 = "9bZkp7q19f0";
const VIDEO_ID_3 = "M7lc1UVf-VE";

test("accepts a normal YouTube watch URL and converts it to the canonical URL", () => {
  const result = promotionalVideoSettingsUpdateSchema.parse({
    videoUrls: [`https://youtube.com/watch?v=${VIDEO_ID_1}&feature=share`, "", ""],
  });

  assert.equal(result.videoUrls[0], `https://www.youtube.com/watch?v=${VIDEO_ID_1}`);
});

test("trims whitespace around pasted YouTube URLs", () => {
  const result = promotionalVideoSettingsUpdateSchema.parse({
    videoUrls: [`  https://youtu.be/${VIDEO_ID_1}  `, "", ""],
  });

  assert.equal(result.videoUrls[0], `https://www.youtube.com/watch?v=${VIDEO_ID_1}`);
});

test("allows three empty video slots", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: ["", "", ""],
  });

  assert.equal(result.success, true);
});

test("accepts exactly three supported YouTube URL forms", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: [
      `https://youtu.be/${VIDEO_ID_1}`,
      `https://m.youtube.com/shorts/${VIDEO_ID_2}`,
      `https://www.youtube.com/embed/${VIDEO_ID_3}`,
    ],
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.videoUrls, [
      `https://www.youtube.com/watch?v=${VIDEO_ID_1}`,
      `https://www.youtube.com/watch?v=${VIDEO_ID_2}`,
      `https://www.youtube.com/watch?v=${VIDEO_ID_3}`,
    ]);
  }
});

test("rejects a body that does not contain exactly three slots", () => {
  assert.equal(
    promotionalVideoSettingsUpdateSchema.safeParse({ videoUrls: ["", ""] }).success,
    false,
  );
  assert.equal(
    promotionalVideoSettingsUpdateSchema.safeParse({ videoUrls: ["", "", "", ""] }).success,
    false,
  );
});

test("rejects a hostname that only looks like YouTube", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: [`https://youtube.com.example.com/watch?v=${VIDEO_ID_1}`, "", ""],
  });

  assert.equal(result.success, false);
});

test("rejects an HTTP YouTube URL", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: [`http://www.youtube.com/watch?v=${VIDEO_ID_1}`, "", ""],
  });

  assert.equal(result.success, false);
});

test("rejects a URL longer than 500 characters", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: [
      `https://www.youtube.com/watch?v=${VIDEO_ID_1}&description=${"a".repeat(500)}`,
      "",
      "",
    ],
  });

  assert.equal(result.success, false);
});

test("rejects a YouTube hostname using a non-standard port", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: [`https://www.youtube.com:8443/watch?v=${VIDEO_ID_1}`, "", ""],
  });

  assert.equal(result.success, false);
});

test("rejects duplicate video IDs even when URL forms differ", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: [
      `https://www.youtube.com/watch?v=${VIDEO_ID_1}`,
      `https://youtu.be/${VIDEO_ID_1}`,
      "",
    ],
  });

  assert.equal(result.success, false);
});

test("rejects a YouTube URL whose video ID is not 11 characters", () => {
  const result = promotionalVideoSettingsUpdateSchema.safeParse({
    videoUrls: ["https://www.youtube.com/watch?v=too-short", "", ""],
  });

  assert.equal(result.success, false);
});

test("creates a youtube-nocookie embed URL", () => {
  assert.equal(
    buildYouTubeEmbedUrl(`https://youtu.be/${VIDEO_ID_1}`),
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID_1}`,
  );
  assert.equal(buildYouTubeEmbedUrl("not-a-youtube-url"), "");
});
