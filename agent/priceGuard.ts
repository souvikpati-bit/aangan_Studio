// Scans anything the agent says (or the prompt itself) for price leakage. The build fails if it finds any.
// Figures below come from the internal pricing guide; they are only used to DETECT leaks, never spoken.
const PRICING_FIGURES = ["1800", "2400", "3500", "1200", "1800", "2800", "4000", "8 lakh", "3.5 lakh"];

const PATTERNS: [string, RegExp][] = [
  ["lakh/crore mentioned", /\b(lakhs?|lacs?|crores?)\b/i],
  ["number + cr/k", /\d[\d,.]*\s*(cr|k)\b/i],
  ["rupee symbol or Rs", /(₹|\brs\.?\s*\d|\brupees?\b)/i],
  ["per sq ft", /per\s*(sq\.?\s*ft|square\s*f)/i],
  ["multiplier hint", /\b\d+(\.\d+)?\s*[x×]\s*(more|the cost|higher)?/i],
  ["price-hint phrases", /(starts?\s+at|starting\s+from|ballpark\s+is|roughly\s+\d|around\s+\d|typically\s+\d)/i],
];

export function findPriceLeaks(text: string): string[] {
  const hits: string[] = [];
  for (const [name, re] of PATTERNS) if (re.test(text)) hits.push(name);
  const flat = text.replace(/[,\s]/g, "");
  for (const fig of PRICING_FIGURES) if (flat.includes(fig.replace(/\s/g, ""))) hits.push(`pricing.md figure ${fig}`);
  return [...new Set(hits)];
}
