// Everything about turning customer text into a risk score lives here, so the
// formula described in the "How the risk score is calculated" dialog has one home.

export const HIGH_FROM = 70;
export const MEDIUM_FROM = 40;
const MIN_SCORE = 12;
const MAX_SCORE = 96;
const START = 24;
const PER_NEGATIVE = 13;
const PER_POSITIVE = 7;

export function severity(score) {
  return score >= HIGH_FROM ? 'High' : score >= MEDIUM_FROM ? 'Medium' : 'Low';
}
export const levelOf = (score) => severity(score).toLowerCase();

export function scoreFrom(negative, positive) {
  const raw = START + negative * PER_NEGATIVE - positive * PER_POSITIVE;
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, raw));
}

export function sentimentFrom(negative, positive) {
  if (negative > positive) return 'Concerned';
  if (positive > negative) return 'Positive';
  return 'Mixed';
}

const NEGATIVE_WORDS = String.raw`unhappy|angry|frustrat\w*|annoy\w*|upset|cancel\w*|leav\w*|switch\w*|disappoint\w*|broken|issue|problem|refund|complain\w*`;
const POSITIVE_WORDS = String.raw`happy|great|love|helpful|excellent|thank\w*|resolved|working well|recommend`;
// "no cancellation language", "not unhappy", "isn't frustrated" should not count as warnings.
const NEGATOR = String.raw`((?:\b(?:no|not|never|without|nothing)|n't)\s+(?:\w+\s+)?)?`;
const matcher = (words) => new RegExp(`${NEGATOR}\\b(${words})\\b`, 'gi');

function hits(text, words) {
  const found = [];
  for (const match of text.matchAll(matcher(words))) {
    if (!match[1]) found.push(match[2].toLowerCase());
  }
  return found;
}

/** Counts warning and praise language in a block of text. */
export function scanText(text) {
  const negative = hits(text, NEGATIVE_WORDS);
  const positive = hits(text, POSITIVE_WORDS);
  return { negative: negative.length, positive: positive.length, terms: [...new Set(negative)] };
}

export function clip(text, max) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[,;:.\s]+$/, '')}…`;
}

const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'customer';

export const DEFAULT_NEXT_STEP = 'Review the source notes and confirm the right next step with the customer.';

/** Combines records for the same person (matched by email, else by name) and rescores them. */
export function mergeCustomers(records) {
  const byKey = new Map();
  for (const record of records) {
    const key = record.email || record.customer.toLowerCase();
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, { ...record, id: slug(key), signals: [...record.signals], sources: [...(record.sources || [])] });
      continue;
    }
    current.calls += record.calls || 0;
    current.contactCount = (current.contactCount || 1) + (record.contactCount || 1);
    current.mentions += record.mentions || 0;
    current.negativeCount += record.negativeCount || 0;
    current.positiveCount += record.positiveCount || 0;
    current.signals = [...new Set([...current.signals, ...record.signals])];
    current.sources = [...new Set([...current.sources, ...(record.sources || [])])];
    current.summary = clip([...new Set([current.summary, record.summary])].slice(0, 3).join(' · '), 420);
    if (current.recommendation === DEFAULT_NEXT_STEP && record.recommendation !== DEFAULT_NEXT_STEP) current.recommendation = record.recommendation;
  }
  const ids = new Set();
  return [...byKey.values()].map((record) => {
    // Two different people can share a slug (e.g. "Sam Lee" with two emails); keep ids unique.
    let id = record.id;
    for (let n = 2; ids.has(id); n += 1) id = `${record.id}-${n}`;
    ids.add(id);
    record.id = id;
    if (!record.aiScored) {
      record.riskScore = scoreFrom(record.negativeCount, record.positiveCount);
      record.sentiment = sentimentFrom(record.negativeCount, record.positiveCount);
    }
    return record;
  });
}
