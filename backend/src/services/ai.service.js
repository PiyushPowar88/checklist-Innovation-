import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

let client;
function getClient() {
  if (!env.groq.apiKey || !env.groq.model) {
    throw new AppError(500, 'GROQ_API_KEY and GROQ_MODEL must be set in backend/.env');
  }
  client ??= new Groq({ apiKey: env.groq.apiKey });
  return client;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseJson(content) {
  const cleaned = String(content).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

/** Calls the model and returns parsed JSON. Retries rate limits, server errors and malformed JSON. */
export async function generateJson({ system, user }, { retries = 2 } = {}) {
  const groq = getClient();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: env.groq.model,
        temperature: 0.1,
        max_completion_tokens: env.groq.maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const choice = res.choices?.[0];
      if (choice?.finish_reason === 'length') {
        throw new AppError(502, 'The model output was cut off. Lower CHUNK_CHARS or raise GROQ_MAX_TOKENS in backend/.env.');
      }
      try {
        return parseJson(choice?.message?.content ?? '');
      } catch {
        lastError = new AppError(502, 'The model returned invalid JSON.');
        continue; // controlled retry
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      lastError = err;
      const retryable = err.status === 429 || err.status >= 500;
      if (!retryable || attempt === retries) break;
      await sleep(2000 * (attempt + 1));
    }
  }
  if (lastError instanceof AppError) throw lastError;
  throw new AppError(502, `AI request failed: ${lastError?.message ?? 'unknown error'}`);
}
