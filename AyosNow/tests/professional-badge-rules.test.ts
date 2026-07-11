import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PROFESSIONAL_BADGE_SETTINGS,
  getEligibleProfessionalBadgeCodes,
} from "../src/lib/professional-badges/professional-badge-rules.ts";

test("awards verified badge when admin approval and identity verification are complete", () => {
  const badges = getEligibleProfessionalBadgeCodes(DEFAULT_PROFESSIONAL_BADGE_SETTINGS, {
    isVerified: true,
    identityVerifiedAt: new Date(),
    completedBookings: 0,
    averageRating: 0,
    responseRate: 0,
    cancellationRate: 0,
    activePenaltyCount: 0,
  });

  assert.deepEqual(badges, ["VERIFIED_PROFESSIONAL"]);
});

test("awards top badge when every configurable threshold is met", () => {
  const badges = getEligibleProfessionalBadgeCodes(DEFAULT_PROFESSIONAL_BADGE_SETTINGS, {
    isVerified: true,
    identityVerifiedAt: new Date(),
    completedBookings: 10,
    averageRating: 4.9,
    responseRate: 95,
    cancellationRate: 2,
    activePenaltyCount: 0,
  });

  assert.deepEqual(badges, ["VERIFIED_PROFESSIONAL", "TOP_PROFESSIONAL"]);
});

test("removes top eligibility when policy version thresholds become stricter", () => {
  const badges = getEligibleProfessionalBadgeCodes(
    {
      ...DEFAULT_PROFESSIONAL_BADGE_SETTINGS,
      topMinCompletedBookings: 20,
    },
    {
      isVerified: true,
      identityVerifiedAt: new Date(),
      completedBookings: 10,
      averageRating: 4.9,
      responseRate: 95,
      cancellationRate: 2,
      activePenaltyCount: 0,
    },
  );

  assert.deepEqual(badges, ["VERIFIED_PROFESSIONAL"]);
});

test("blocks top badge when there is an active admin penalty", () => {
  const badges = getEligibleProfessionalBadgeCodes(DEFAULT_PROFESSIONAL_BADGE_SETTINGS, {
    isVerified: true,
    identityVerifiedAt: new Date(),
    completedBookings: 50,
    averageRating: 5,
    responseRate: 100,
    cancellationRate: 0,
    activePenaltyCount: 1,
  });

  assert.deepEqual(badges, ["VERIFIED_PROFESSIONAL"]);
});
