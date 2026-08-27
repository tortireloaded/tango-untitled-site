# Tango Untitled — Chat Widget Worker

Cloudflare Worker that proxies chat requests from the static site
(ChatBubble.astro) to **Minimax's Anthropic-compatible API**.

The system prompt carries:
1. Site knowledge (home, about, classes, location, contact)
2. The full `Tango_Untitled_FAQ_New_Joiners.docx` (verbatim, 33 Q&A in EN + 廣東話)
3. Behaviour rules: mirror user language, never invent, route bookings

## Deploy

```bash
npm install
npx wrangler secret put MINIMAX_API_KEY   # paste key at the prompt
npm run deploy
```

After first deploy, Cloudflare gives you a URL like:

```
https://tango-untitled-chat.<your-subdomain>.workers.dev
```

Set this URL as a `PUBLIC_CHAT_API_URL` env var on the static site (i.e. in
the GitHub Actions workflow environment), and the static site's
`ChatBubble.astro` component will use it.

## Configuration

Edit `wrangler.toml` to change defaults, or override per-environment:

| Setting | Default | Notes |
|---|---|---|
| `MINIMAX_MODEL` | `claude-sonnet-4-20250514` | Set via `[vars]` in `wrangler.toml` |
| `MAX_TOKENS` | `1024` | Set via `[vars]` |
| `CORS_ORIGIN` | `https://tortireloaded.github.io` | Set to the page URL that calls the worker |

The API key (`MINIMAX_API_KEY`) is **always** set via `wrangler secret put`,
never checked into git.

## Editing the knowledge

Edit `src/knowledge.ts`. After saving, redeploy with `npm run deploy`. Or
just `git push` — wrangler isn't (yet) configured to auto-deploy, so a single
manual deploy command keeps things explicit.

## Local dev

```bash
npm run dev
# wrangler serves at http://127.0.0.1:8787
# Test it:  curl -X POST http://127.0.0.1:8787 -H "Content-Type: application/json"
#           -d '{"messages":[{"role":"user","content":"hi"}]}'
```

You'll need `MINIMAX_API_KEY` available to wrangler locally too. Either run
`wrangler secret put MINIMAX_API_KEY` once (it persists in `~/.wrangler/` per
account), or set the env var in `.dev.vars` (which is git-ignored).

## Cost

For a small studio's chat traffic (~5-50 conversations/day),
expect **$1-5/month** in MiniMax API costs on the worker side. The
Cloudflare Worker free tier covers 100k requests/day — well within budget.
