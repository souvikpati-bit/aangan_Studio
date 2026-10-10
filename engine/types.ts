export type CallType = "new_lead" | "returning" | "complaint" | "missed" | "spam";
export type Result = "pass" | "fail" | "unclear";
export type Verdict = "Qualified" | "Not qualified" | "Needs human" | "Escalate" | "Missed" | "Closed";

/** What the extraction step (LLM) returns. The engine never guesses missing values. */
export interface Facts {
  call_type: CallType;
  wants_execution?: boolean | null; // false = advice only
  property_type?: "home" | "office" | "restaurant" | "hotel" | "retail" | "gym" | "other" | null;
  home_kind?: "apartment" | "villa" | null;
  locality?: string | null;
  city?: string | null; // the city the caller named (Pune, Pimpri-Chinchwad, Nashik...), separate from the neighbourhood
  scope_kind?: "full_home" | "partial" | "single_room" | "office" | "unknown" | null;
  rooms_count?: number | null;
  sqft?: number | null;
  needed_by?: string | null; // ISO date the project must be complete / move-in ready
  needed_by_words?: string | null;
  start_by?: string | null;
  budget_max_inr?: number | null; // upper end of a volunteered budget
  decision_maker?: "yes" | "authorised" | "unclear" | null;
  decision_maker_note?: string | null;
  referrer?: string | null;
  price_asked?: boolean;
  follow_up?: boolean;
  follow_up_note?: string | null;
  service_recovery?: boolean;
  key_facts_missing?: boolean; // caller hung up before key facts were captured
  angry_or_bad_line?: boolean;
  /** extraction confidence per criterion, 0..1 (default 0.9) */
  conf?: Partial<Record<"c1" | "c2" | "c3" | "c4" | "c5", number>>;
}

export interface Criterion {
  result: Result;
  note: string;
  confidence: number;
}

export interface Qualification {
  verdict: Verdict;
  reason: string;
  score: number | null;
  criteria: Record<"c1" | "c2" | "c3" | "c4" | "c5", Criterion>;
  flags: string[];
  notes: string[];
  weeks_to_deadline: number | null;
  question?: string; // the one direct question to ask when 1-3 is unclear
}

export interface Settings {
  timeline: { fail_under_weeks: number; human_under_weeks: number; tight_under_weeks: number };
  commercial: { min_sqft: number; max_sqft: number; out_of_scope_types: string[] };
  budget: {
    per_room_floor_inr: number;
    full_home_floor_per_sqft_inr: number;
    commercial_floor_per_sqft_inr: number;
    clear_fail_fraction_of_floor: number;
  };
  confidence: { min_to_decline: number };
  score: { pass: number; unclear: number; fail: number; pass_mark: number };
  flags: { high_value_sqft: number; vip_referrers: string[] };
  dedupe: { same_number_window_hours: number; drop_merge_minutes: number };
}

export interface ServiceArea {
  pune_city: string[];
  pcmc: string[];
  adjoining_unlisted_but_in_pune: string[];
  outside: string[];
}
