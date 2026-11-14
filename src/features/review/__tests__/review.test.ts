import { describe, expect, it } from '@jest/globals';

import { REVIEW_GAP_MS, shouldAskForReview } from '../review-rules';

describe('shouldAskForReview', () => {
  const now = Date.UTC(2026, 10, 14);
  it('asks after the first goal met or a 3-day streak', () => {
    expect(shouldAskForReview(null, 0, true, now)).toBe(true);
    expect(shouldAskForReview(null, 3, false, now)).toBe(true);
    expect(shouldAskForReview(null, 2, false, now)).toBe(false);
  });
  it('waits 30 days between prompts', () => {
    expect(shouldAskForReview(now - REVIEW_GAP_MS + 1, 5, true, now)).toBe(false);
    expect(shouldAskForReview(now - REVIEW_GAP_MS, 5, true, now)).toBe(true);
  });
});
