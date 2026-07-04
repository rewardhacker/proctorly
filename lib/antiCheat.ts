import type { FocusEvent } from "@prisma/client";

// ponytail: fixed default rules, not tutor-configurable yet. Add a
// per-paper/invite override when a tutor actually asks for different
// thresholds.
const SWITCH_LIMIT = 3;
const AWAY_MS_LIMIT = 10_000;

export function computeFlagStatus(events: FocusEvent[]) {
  const switchCount = events.filter((e) => e.type === "VISIBILITY_HIDDEN").length;
  const totalAwayMs = events
    .filter((e) => e.type === "VISIBILITY_VISIBLE")
    .reduce((sum, e) => sum + (e.durationMs ?? 0), 0);
  const copyPasteAttempts = events.filter((e) =>
    ["COPY_ATTEMPT", "PASTE_ATTEMPT", "CONTEXT_MENU_ATTEMPT"].includes(e.type),
  ).length;

  return {
    switchCount,
    totalAwayMs,
    copyPasteAttempts,
    flagged: switchCount > SWITCH_LIMIT || totalAwayMs > AWAY_MS_LIMIT,
  };
}
