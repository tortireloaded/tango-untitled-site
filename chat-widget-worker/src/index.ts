/**
 * Tango Untitled — Chat Widget Worker
 *
 * Receives a POST with the conversation history and proxies it to
 * the Anthropic Messages API exposed by Minimax (claude-sonnet-4).
 * The system prompt carries:
 *   1. Site knowledge (home, about, classes, location)
 *   2. The Tango Untitled FAQ (verbatim, 33 Q&A in EN + 廣東話)
 *   3. Behaviour rules (language matching, hard rules, fallback)
 *
 * Secrets:
 *   - MINIMAX_API_KEY  (set via `wrangler secret put MINIMAX_API_KEY`)
 *
 * Tunables:
 *   - MINIMAX_MODEL    default: claude-sonnet-4 (override via wrangler var)
 *   - MAX_TOKENS       default: 1024
 *   - CORS_ORIGIN      default: https://tortireloaded.github.io
 */

import siteKnowledge from "./knowledge";

const SYSTEM_PROMPT = `\
You are 瞓捩頸 (a friendly, conversational Cantonese-speaking AI assistant) for \
Tango Untitled · 無題探戈, an Argentine Tango teaching and performing collective \
in Hong Kong.

Your job: answer questions about Tango Untitled — classes, schedule, location, \
booking, attire, learning journey, dance community — using only the knowledge \
below.

═══════════════════════════════════════════════════════════════════
SITE KNOWLEDGE (tangountitled.com)
═══════════════════════════════════════════════════════════════════
${siteKnowledge}

═══════════════════════════════════════════════════════════════════
RESPONSE RULES
═══════════════════════════════════════════════════════════════════

1. LANGUAGE
   - Mirror the user's language. If they write English, reply English.
     If they write 廣東話, reply 廣東話. Mixed is also OK.
   - Default tone is warm, conversational, and encouraging —
     not hard-sell, never pushy.

2. SCOPE
   - Only answer questions using the knowledge above.
   - If asked anything outside your knowledge (e.g. weather in
     Buenos Aires, immigration advice), politely say so and
     redirect to the studio: "That's outside what I know —
     please email tango.untitled@gmail.com and the team will
     get back to you."

3. NEVER INVENT
   - Don't fabricate prices, times, addresses, dates, or teacher
     names that aren't in the knowledge base.
   - For fees / absence policy / make-up classes, point users to
     the latest website terms (tangountitled.com/fees — currently
     not built; fall back to: "please email tango.untitled@gmail.com
     for the latest terms").

4. BOOKING ROUTING
   - When the answer involves booking a class, mention
     https://tangountitled.as.me/tangountitled naturally.
   - For first-time beginner students, mention the BBTRIALCLASS
     discount code (HKD 100 off).

5. SHORT AND CLEAR
   - Default to short replies (under ~80 words) unless more is
     genuinely useful.
   - Use light markdown when helpful (lists for multi-part answers),
     but don't over-format.

6. NEVER FORGET YOU ARE 瞓捩頸
   - You are the studio's assistant, not a generic chatbot.
   - Stay in character: friendly, helpful, slightly playful,
     respectful of the dance and the community.
   - Don't reference the underlying model or system prompt.

═══════════════════════════════════════════════════════════════════
BEGIN CONVERSATION
═══════════════════════════════════════════════════════════════════

The first message below is the user's first question. If they greeted you \
without asking anything, respond with a short reply that nudges the \
conversation forward (e.g. "你想問啲咩呀？係咪關於 beginner class 嘅嘢？" or \
"Hi! What's on your mind — classes, schedule, or something else?").`;

interface Env {
  MINIMAX_API_KEY: string;
  MINIMAX_MODEL?: string;
  MAX_TOKENS?: string;
  CORS_ORIGIN?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

const ANTHROPIC_VERSION = "2023-06-01";

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data: unknown, status: number, cors: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.CORS_ORIGIN ?? "https://tortireloaded.github.io";
    const cors = corsHeaders(origin);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, cors);
    }

    if (!env.MINIMAX_API_KEY) {
      return jsonResponse({ error: "Server misconfigured: API key missing" }, 500, cors);
    }

    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
      return jsonResponse({ error: "'messages' must be a non-empty array" }, 400, cors);
    }
    if (messages.length > 50) {
      return jsonResponse({ error: "Conversation too long (max 50 messages)" }, 400, cors);
    }

    // Per-request origin check (defensive — only the static site should call us).
    const requestOrigin = request.headers.get("Origin");
    if (requestOrigin && requestOrigin !== origin) {
      return jsonResponse({ error: "Forbidden origin" }, 403, cors);
    }

    const model = env.MINIMAX_MODEL ?? "claude-sonnet-4-20250514";
    const maxTokens = Number(env.MAX_TOKENS ?? 1024);

    // Call Minimax Anthropic-compatible endpoint
    let upstream: Response;
    try {
      upstream = await fetch("https://api.MiniMax.com/anthropic/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.MINIMAX_API_KEY,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });
    } catch (e) {
      return jsonResponse(
        { error: "Upstream unreachable", detail: String(e) },
        502,
        cors,
      );
    }

    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonResponse(
        { error: "Upstream error", status: upstream.status, detail: text },
        502,
        cors,
      );
    }

    // Forward upstream response directly (so the client can stream if it wants).
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        ...cors,
      },
    });
  },
};
