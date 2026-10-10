// Creates the Aangan agent in Vaani Voice (api.vaanivoice.ai) and configures it. Re-running updates it instead of duplicating.
import { readFileSync, writeFileSync } from "node:fs";

const BASE = "https://api.vaanivoice.ai";
const key = process.env.VAANI_API_KEY;
if (!key) throw new Error("VAANI_API_KEY is not set in .env");
const H = { "X-API-Key": key, "Content-Type": "application/json" };
const NAME = "Aangan Studio Front Desk";

async function call(method: string, path: string, body?: unknown) {
  const r = await fetch(BASE + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json: any; try { json = JSON.parse(text); } catch { json = text; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${typeof json === "string" ? json.slice(0, 300) : JSON.stringify(json).slice(0, 400)}`);
  return json;
}

const systemPrompt = readFileSync(new URL("../agent/vaani_system_prompt.txt", import.meta.url), "utf8");
const greeting = "Hello, Aangan Studio. I'm an AI assistant, and this call may be recorded so we can help you better. How can I help you today?";

const persona = {
  identity: {
    system_prompt: systemPrompt,
    personality: { tone: "warm", style: "brief and professional" },
    greeting_message: { agent_message: greeting, agent_speech_delay: 0, interruptible: false, let_user_speak_first: false },
  },
  senses_capabilities: { language: "en", auto_detect: true },
};
const experience = { settings: { call_settings: { max_call_duration: 10, max_duration_enabled: true, max_duration_action: "hang_up" } } };
const dp = (name: string, prompt: string, values?: string[]) => ({ name, prompt, nullable: true, ...(values ? { values } : {}) });
const analysis = {
  extraction: {
    data_collection: {
      enabled: true,
      data_points: [
        dp("call_type", "Classify the call.", ["new_lead", "returning", "complaint", "missed", "spam"]),
        dp("customer_name", "The caller's name, only if they said it."),
        dp("property_type", "home or office (or restaurant/hotel/retail/gym/other). Only if said."),
        dp("locality", "Area or locality of the property in Pune/PCMC or elsewhere, as said by the caller."),
        dp("carpet_area_sqft", "Approx carpet area in sq ft, as a number, only if said."),
        dp("scope", "What they want done (full home, rooms, office areas), in the caller's words."),
        dp("current_state", "new possession, lived in, or bare shell. Only if said."),
        dp("needed_by_words", "When they need it complete or move-in ready, in the caller's own words."),
        dp("wants_execution", "true if they want design AND execution; false if advice or ideas only; null if unclear.", ["true", "false"]),
        dp("decision_maker", "Does the caller decide? yes, authorised (someone approved), or unclear.", ["yes", "authorised", "unclear"]),
        dp("budget_volunteered", "Any budget the caller volunteered, in their words. Never ask for one."),
        dp("referrer", "Name of the person who referred them, if any."),
        dp("how_found", "How they heard of Aangan (referral, Instagram, Google, LinkedIn, other)."),
        dp("price_asked", "true if the caller asked about price or cost.", ["true", "false"]),
        dp("consult_mode", "site_visit or call, as preferred.", ["site_visit", "call"]),
        dp("availability", "Days and times the caller said they are free."),
        dp("recording_declined", "true if the caller objected to the call being recorded.", ["true", "false"]),
        dp("wants_human", "true if the caller asked for a person.", ["true", "false"]),
      ],
    },
    collect_concerns: { enabled: true, prompt: "Capture any complaint or unresolved issue the caller raised, especially from an existing client." },
  },
  evaluations: { conversation_evaluation: { enabled: false } },
};

const envPath = new URL("../.env", import.meta.url);
let agentId = process.env.VAANI_AGENT_ID || "";
if (!agentId) {
  const existing = await call("GET", "/api/list-agents");
  const found = Array.isArray(existing) ? existing.find((a: any) => (a.agent_display_name ?? a.agent_name) === NAME) : null;
  if (found) agentId = found.agent_id;
}
if (!agentId) {
  const created = await call("POST", "/api/create-agent", { agent_display_name: NAME });
  agentId = created.agent_id;
  console.log("created agent");
} else console.log("agent already exists, updating");

let env = readFileSync(envPath, "utf8");
env = env.replace(/^VAANI_AGENT_ID=.*$/m, `VAANI_AGENT_ID=${agentId}`);
writeFileSync(envPath, env);

await call("PATCH", `/api/agent/${agentId}/persona`, persona); console.log("persona set");
await call("PATCH", `/api/agent/${agentId}/experience`, experience); console.log("experience set (max 10 min)");
const final = await call("PATCH", `/api/agent/${agentId}/analysis`, analysis); console.log("analysis set (18 data points)");
console.log("agent_id saved to .env: ", agentId);
console.log("frontend_features:", JSON.stringify(final.frontend_features));
console.log("greeting:", final.persona?.identity?.greeting_message?.agent_message?.slice(0, 60));
console.log("prompt chars:", final.persona?.identity?.system_prompt?.length);
console.log("language:", final.persona?.senses_capabilities?.language, "auto_detect:", final.persona?.senses_capabilities?.auto_detect);
console.log("max duration:", JSON.stringify(final.experience?.settings?.call_settings));
console.log("data points:", final.analysis?.extraction?.data_collection?.data_points?.length, "warnings:", JSON.stringify(final.warnings));
