import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are a senior copy editor for a social impact organization. Optimize for clarity, brevity, action, and platform fit.
Respect HARD CONSTRAINTS: do not exceed character limits; do not change URLs; include REQUIRED PHRASES; remove BANNED WORDS.
Preserve meaning and factual content. Return ONLY strict JSON with keys: score, flags, suggestion, variants, explanations. No extra text or markdown.
If constraints are impossible, produce the closest valid text and list violations in flags.`;

// Allow model and API base to be configured via environment variables
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

type Platform =
  | 'Instagram'
  | 'LinkedIn'
  | 'X/Twitter'
  | 'Facebook'
  | 'TikTok'
  | 'YouTube'
  | 'Threads'
  | 'Pinterest';

type AssetType = 'Video' | 'Design' | 'Carousel';

type CopyCheckInput = {
  text: string;
  platform: Platform;
  assetType: AssetType;
  readingLevelTarget?: string;
  constraints: {
    maxChars: number;
    maxHashtags?: number;
    requireCTA?: boolean;
  };
  brand: {
    bannedWords: string[];
    requiredPhrases: string[];
    tone: {
      confident: number;
      compassionate: number;
      evidenceLed: number;
    };
  };
};

type CopyCheckOutput = {
  score: {
    clarity: number;
    brevity: number;
    hook: number;
    fit: number;
    readingLevel: string;
  };
  flags: string[];
  suggestion: { text: string };
  variants: { label: string; text: string }[];
  explanations: string[];
};

type RateBucket = { tokens: number; ts: number };
const RL = new Map<string, RateBucket>();
const RL_LIMIT = 20;
const RL_INTERVAL = 60_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return res.status(405).end();
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  if (!rateLimit(req, RL_LIMIT, RL_INTERVAL)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const body = typeof req.body === 'string' ? safeParseJSON(req.body) : req.body;
  if (!body) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { error, data } = validateInput(body);
  if (error || !data) {
    return res.status(400).json({ error });
  }

  try {
    const primaryResult = await generatePrimarySuggestion(data);
    const variants = await generateVariants(data);
    const combined: CopyCheckOutput = {
      ...primaryResult,
      variants,
    };
    const safe = postValidate(combined, data, data.text);
    return res.status(200).json(safe);
  } catch (err: any) {
    if (err?.code === 'LLM_INVALID_JSON') {
      const fallback = ruleBasedFallback(data);
      return res.status(422).json(fallback);
    }
    if (err?.code === 'LLM_ERROR') {
      return res.status(502).json({ error: 'Upstream LLM error' });
    }
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}

function rateLimit(req: VercelRequest, limit: number, interval: number) {
  const ip =
    (Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for']) || req.headers['x-real-ip'] || req.socket.remoteAddress || 'anon';
  const bucket = RL.get(ip) || { tokens: limit, ts: Date.now() };
  const now = Date.now();
  const refill = Math.floor(((now - bucket.ts) / interval) * limit);
  if (refill > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + refill);
    bucket.ts = now;
  }
  if (bucket.tokens <= 0) {
    RL.set(ip, bucket);
    return false;
  }
  bucket.tokens -= 1;
  RL.set(ip, bucket);
  return true;
}

function safeParseJSON<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function validateInput(payload: any): { error?: string; data?: CopyCheckInput } {
  if (typeof payload !== 'object' || payload === null) {
    return { error: 'Payload must be an object' };
  }
  const requiredStrings: Array<[keyof CopyCheckInput, string]> = [
    ['text', 'text'],
    ['platform', 'platform'],
    ['assetType', 'assetType'],
  ];
  for (const [key, label] of requiredStrings) {
    if (typeof payload[key] !== 'string' || !payload[key].trim()) {
      return { error: `${label} is required` };
    }
  }
  if (!isPlatform(payload.platform)) {
    return { error: 'Invalid platform' };
  }
  if (!isAssetType(payload.assetType)) {
    return { error: 'Invalid assetType' };
  }
  if (!payload.constraints || typeof payload.constraints !== 'object') {
    return { error: 'constraints object required' };
  }
  if (typeof payload.constraints.maxChars !== 'number' || payload.constraints.maxChars <= 0) {
    return { error: 'constraints.maxChars must be a positive number' };
  }
  const constraints = {
    maxChars: payload.constraints.maxChars,
    maxHashtags: typeof payload.constraints.maxHashtags === 'number' ? payload.constraints.maxHashtags : undefined,
    requireCTA: Boolean(payload.constraints.requireCTA),
  };
  if (!payload.brand || typeof payload.brand !== 'object') {
    return { error: 'brand object required' };
  }
  const brand = {
    bannedWords: Array.isArray(payload.brand.bannedWords) ? payload.brand.bannedWords.map(String) : [],
    requiredPhrases: Array.isArray(payload.brand.requiredPhrases)
      ? payload.brand.requiredPhrases.map(String)
      : [],
    tone: payload.brand.tone || { confident: 0.5, compassionate: 0.5, evidenceLed: 0.5 },
  };
  const data: CopyCheckInput = {
    text: String(payload.text),
    platform: payload.platform,
    assetType: payload.assetType,
    readingLevelTarget: payload.readingLevelTarget ? String(payload.readingLevelTarget) : undefined,
    constraints,
    brand,
  };
  return { data };
}

function isPlatform(value: any): value is Platform {
  return (
    value === 'Instagram' ||
    value === 'LinkedIn' ||
    value === 'X/Twitter' ||
    value === 'Facebook' ||
    value === 'TikTok' ||
    value === 'YouTube' ||
    value === 'Threads' ||
    value === 'Pinterest'
  );
}

function isAssetType(value: any): value is AssetType {
  return value === 'Video' || value === 'Design' || value === 'Carousel';
}

async function generatePrimarySuggestion(input: CopyCheckInput): Promise<Omit<CopyCheckOutput, 'variants'>> {
  const schemaDescription = buildSchemaDescription();
  const prompt = buildPrompt(input, schemaDescription);
  const firstAttempt = await callLLM(prompt, 0.3);
  let parsed = tryParseJSON<CopyCheckOutput>(firstAttempt);
  if (!parsed) {
    const retryPrompt = `${prompt}\n\nReturn ONLY strict JSON matching the schema.`;
    const secondAttempt = await callLLM(retryPrompt, 0.25);
    parsed = tryParseJSON<CopyCheckOutput>(secondAttempt);
    if (!parsed) {
      const err: any = new Error('Invalid JSON from LLM');
      err.code = 'LLM_INVALID_JSON';
      throw err;
    }
  }
  return {
    score: parsed.score,
    flags: parsed.flags,
    suggestion: parsed.suggestion,
    explanations: parsed.explanations,
  };
}

async function generateVariants(input: CopyCheckInput): Promise<{ label: string; text: string }[]> {
  const prompt = buildVariantPrompt(input);
  const raw = await callLLM(prompt, 0.6);
  const parsed = tryParseJSON<{ variants: { label: string; text: string }[] }>(raw);
  if (parsed?.variants && Array.isArray(parsed.variants)) {
    return parsed.variants.slice(0, 3);
  }
  return [
    { label: 'Shorter', text: ensureCTA('Trim your copy. Take action today.', input.constraints.requireCTA) },
  ];
}

function buildPrompt(input: CopyCheckInput, schema: string) {
  const payload = JSON.stringify(input);
  return `Input JSON: ${payload}\nOutput Schema: ${schema}`;
}

function buildVariantPrompt(input: CopyCheckInput) {
  const payload = JSON.stringify(input);
  const schema = JSON.stringify({ variants: [{ label: 'string', text: 'string' }] });
  return `Create up to 3 alternate copy variants with distinct labels (e.g., "Shorter", "Hook+", "Human").
Respect the same constraints as input. Return ONLY JSON matching: ${schema}. Input: ${payload}`;
}

function buildSchemaDescription() {
  return JSON.stringify({
    score: { clarity: 'number 0-1', brevity: 'number 0-1', hook: 'number 0-1', fit: 'number 0-1', readingLevel: 'string' },
    flags: ['string'],
    suggestion: { text: 'string' },
    variants: [{ label: 'string', text: 'string' }],
    explanations: ['string'],
  });
}

async function callLLM(prompt: string, temperature: number): Promise<string> {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      const err: any = new Error('LLM error');
      err.code = 'LLM_ERROR';
      throw err;
    }
    const json: any = await response.json();
    return json?.choices?.[0]?.message?.content || '';
  } catch (error: any) {
    if (error?.code) throw error;
    const err: any = new Error('LLM error');
    err.code = 'LLM_ERROR';
    throw err;
  }
}

function tryParseJSON<T>(value: string): T | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

function postValidate(result: CopyCheckOutput, input: CopyCheckInput, originalText: string): CopyCheckOutput {
  const safe: CopyCheckOutput = {
    score: sanitizeScore(result.score),
    flags: Array.isArray(result.flags) ? [...new Set(result.flags.map((f) => String(f)))] : [],
    suggestion: { text: '' },
    variants: Array.isArray(result.variants) ? result.variants.slice(0, 3) : [],
    explanations: Array.isArray(result.explanations) ? result.explanations.map((e) => String(e)) : [],
  };
  const constraint = input.constraints;
  const brand = input.brand;
  safe.suggestion.text = enforceConstraints(result.suggestion?.text || input.text, originalText, constraint, brand);
  safe.variants = safe.variants.map((variant, idx) => ({
    label: variant?.label ? String(variant.label) : `Variant ${idx + 1}`,
    text: enforceConstraints(variant?.text || input.text, originalText, constraint, brand),
  }));
  if (!safe.variants.length) {
    safe.variants.push({ label: 'Alt', text: enforceConstraints(input.text, originalText, constraint, brand) });
  }
  if (!safe.score.readingLevel) {
    safe.score.readingLevel = input.readingLevelTarget || 'Grade 8';
  }
  if (!safe.explanations.length) {
    safe.explanations.push('Copy adjusted to respect hard constraints.');
  }
  return safe;
}

function sanitizeScore(score: CopyCheckOutput['score']): CopyCheckOutput['score'] {
  const clamp = (value: any) => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(num)) return 0.7;
    return Math.max(0, Math.min(1, num));
  };
  return {
    clarity: clamp(score?.clarity),
    brevity: clamp(score?.brevity),
    hook: clamp(score?.hook),
    fit: clamp(score?.fit),
    readingLevel: score?.readingLevel ? String(score.readingLevel) : 'Grade 8',
  };
}

function enforceConstraints(
  text: string,
  originalText: string,
  constraints: CopyCheckInput['constraints'],
  brand: CopyCheckInput['brand']
) {
  const trimmed = text?.trim?.() || '';
  const base = trimmed || originalText;
  const { masked, urls } = maskUrls(base);
  let working = masked;
  working = removeBannedWords(working, brand.bannedWords);
  working = ensureRequiredPhrases(working, brand.requiredPhrases);
  working = enforceHashtagLimit(working, constraints.maxHashtags);
  if (constraints.requireCTA) {
    working = ensureCTA(working, true);
  }
  let restored = restoreUrls(working, urls);
  restored = trimToLimit(restored, constraints.maxChars, urls);
  restored = collapseWhitespace(restored);
  restored = ensureRequiredPhrases(restored, brand.requiredPhrases);
  return restored;
}

function maskUrls(text: string) {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls: string[] = [];
  const masked = text.replace(urlRegex, (match) => {
    const token = `__URL_${urls.length}__`;
    urls.push(match);
    return token;
  });
  return { masked, urls };
}

function restoreUrls(text: string, urls: string[]) {
  let restored = text;
  urls.forEach((url, index) => {
    const token = `__URL_${index}__`;
    restored = restored.replaceAll(token, url);
  });
  return restored;
}

function removeBannedWords(text: string, words: string[] = []) {
  let output = text;
  for (const word of words) {
    if (!word) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    output = output.replace(pattern, '').replace(/\s{2,}/g, ' ');
  }
  return output;
}

function ensureRequiredPhrases(text: string, phrases: string[] = []) {
  let output = text;
  for (const phrase of phrases) {
    if (!phrase) continue;
    if (!new RegExp(escapeRegExp(phrase), 'i').test(output)) {
      output = `${output.trim()} ${phrase}`.trim();
    }
  }
  return output;
}

function enforceHashtagLimit(text: string, maxHashtags?: number) {
  if (!maxHashtags || maxHashtags <= 0) return text;
  const hashtags = text.match(/(^|\s)#(?![0-9_]+\b)[A-Za-z0-9_]+/g) || [];
  if (hashtags.length <= maxHashtags) return text;
  let remaining = maxHashtags;
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^#/.test(token)) {
        if (remaining > 0) {
          remaining -= 1;
          return token;
        }
        return token.replace('#', '');
      }
      return token;
    })
    .join('');
}

function ensureCTA(text: string, required: boolean | undefined) {
  if (!required) return text;
  const CTA_REGEX = /(take action|learn more|join us|sign up|donate|act now)/i;
  if (CTA_REGEX.test(text)) return text;
  return `${text.trim()} Take action today.`.trim();
}

function trimToLimit(text: string, limit: number, urls: string[]) {
  if (text.length <= limit) return text;
  let trimmed = text.slice(0, limit);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > limit - 20) {
    trimmed = trimmed.slice(0, lastSpace);
  }
  for (const url of urls) {
    if (!trimmed.includes(url)) {
      const originalIndex = text.indexOf(url);
      if (originalIndex >= 0 && originalIndex < trimmed.length) {
        trimmed = text.slice(0, Math.min(text.length, originalIndex + url.length));
      } else {
        trimmed = `${trimmed.trim()} ${url}`.trim();
      }
    }
  }
  if (trimmed.length > limit) {
    trimmed = `${trimmed.slice(0, limit - 1)}…`;
  }
  return trimmed;
}

function collapseWhitespace(text: string) {
  return text.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listUrls(text: string) {
  return text.match(/https?:\/\/[^\s]+/gi) || [];
}

function ruleBasedFallback(input: CopyCheckInput): CopyCheckOutput {
  const flags: string[] = [];
  let text = input.text;
  const cleaned = enforceConstraints(text, input.text, input.constraints, input.brand);
  if (cleaned.length > input.constraints.maxChars) {
    flags.push('Trimmed to meet character limit');
  }
  input.brand.requiredPhrases.forEach((phrase) => {
    if (phrase && !new RegExp(escapeRegExp(phrase), 'i').test(cleaned)) {
      flags.push(`Required phrase missing: ${phrase}`);
    }
  });
  const score = {
    clarity: 0.7,
    brevity: Math.min(0.9, cleaned.length / input.constraints.maxChars),
    hook: 0.6,
    fit: 0.75,
    readingLevel: input.readingLevelTarget || 'Grade 8',
  };
  return {
    score,
    flags,
    suggestion: { text: cleaned },
    variants: [
      {
        label: 'Shorter',
        text: trimToLimit(cleaned, Math.round(input.constraints.maxChars * 0.8), listUrls(cleaned)),
      },
      { label: 'CTA+', text: ensureCTA(cleaned, true) },
    ],
    explanations: ['Rule-based fallback applied due to JSON issues.'],
  };
}
