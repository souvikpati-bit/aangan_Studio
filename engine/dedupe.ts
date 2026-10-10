export interface CallRef {
  id: string;
  phone: string | null;
  started_at: string; // ISO, UTC
  ended_at?: string;
  complete: boolean; // false = dropped before key facts
}

/**
 * Group calls into leads. Same phone within the window merges; a call within
 * `dropMergeMinutes` of a dropped call from the same number always merges.
 * Withheld numbers (phone = null) never merge - the agent must ask for a number.
 */
export function groupCalls(calls: CallRef[], windowHours: number, dropMergeMinutes: number): string[][] {
  const sorted = [...calls].sort((a, b) => +new Date(a.started_at) - +new Date(b.started_at));
  const groups: CallRef[][] = [];
  for (const c of sorted) {
    const g = c.phone
      ? groups.find((grp) => {
          const last = grp[grp.length - 1];
          if (last.phone !== c.phone) return false;
          const gapMin = (+new Date(c.started_at) - +new Date(last.ended_at ?? last.started_at)) / 60_000;
          if (!last.complete && gapMin <= dropMergeMinutes) return true;
          return (+new Date(c.started_at) - +new Date(last.started_at)) / 3_600_000 <= windowHours;
        })
      : undefined;
    if (g) g.push(c);
    else groups.push([c]);
  }
  return groups.map((g) => g.map((c) => c.id));
}
