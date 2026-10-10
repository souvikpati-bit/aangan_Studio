export type Verdict = "Qualified" | "Not qualified" | "Needs human" | "Escalate" | "Missed" | "Closed";
export type Result = "pass" | "fail" | "unclear";
export interface Criterion { result: Result; note: string; confidence: number }

export interface Lead {
  id: string;
  demo: boolean;
  order: number;
  name: string;
  phone: string;
  calledAt: string;
  duration: string;
  summary: string;
  source: string;
  slot: string | null;
  mode: string | null;
  verdict: Verdict;
  reason: string;
  score: number | null;
  flags: string[];
  notes: string[];
  question: string | null;
  criteria: Record<"c1" | "c2" | "c3" | "c4" | "c5", Criterion>;
  property: string;
  asked: string[];
  status: string;
  priceAsked: boolean;
  followUpNote: string | null;
  escalation: { promiseMinutes: number; startedAgoMinutes: number } | null;
  callId?: string;
  transcript?: string;
  hasRecording?: boolean;
  startedAt?: string;
}

export const TABS = ["Qualified", "Needs human", "Escalations", "Declined", "Follow-up"] as const;
export type Tab = (typeof TABS)[number];

export function inTab(l: Lead, tab: Tab): boolean {
  switch (tab) {
    case "Qualified": return l.verdict === "Qualified";
    case "Needs human": return l.verdict === "Needs human" || l.verdict === "Missed";
    case "Escalations": return l.verdict === "Escalate";
    case "Declined": return l.verdict === "Not qualified" || l.verdict === "Closed";
    case "Follow-up": return l.flags.includes("follow_up");
  }
}

export const verdictClass: Record<Verdict, string> = {
  Qualified: "ok", "Not qualified": "declined", "Needs human": "human", Escalate: "esc", Missed: "human", Closed: "declined",
};
