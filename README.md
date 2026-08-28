# Tango Untitled — Site

Static rebuild of tangountitled.com. Astro 7, deploys to GitHub Pages. Includes a custom AI chat bubble (cloud-hosted LLM via Cloudflare Worker).

- **Live URL (when deployed):** https://tortireloaded.github.io/tango-untitled-site/
- **Source:** https://github.com/tortireloaded/tango-untitled-site
- **Stack:** Astro 7 + system fonts + WebP images + Cloudflare Worker chat proxy.
- **Chatbot:** 瞓捩頸 (AI assistant for Tango Untitled) — see `chat-widget-worker/`

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output to ./dist
npm run preview      # serve ./dist to test the production build
```

(You can also use `bun` if installed — same commands, swap `npm` for `bun`.)

## Project structure

```
src/
  assets/images/         # original photos (compiled to WebP at build time)
  components/
    Header.astro         # sticky navigation (transparent on home, opaque elsewhere)
    Footer.astro         # minimal footer with social links
  layouts/
    BaseLayout.astro     # HTML head, OG/Twitter, JSON-LD, header + footer
  pages/
    index.astro          # home (dark hero + light body)
    about.astro
    classes.astro
    location.astro
    book.astro           # placeholder; links to Acuity scheduling
    404.astro            # graceful not-found page
  styles/
    global.css           # tokens, layout primitives, type scale
public/
  favicon.svg            # "T" mark on ink-black square
  favicon.ico
  robots.txt
```

## Deployment (Cloudflare Pages via GitHub)

### 1. Connect the repo to Cloudflare Pages

1. Go to https://dash.cloudflare.com → Workers & Pages → Create → Pages → **Connect to Git**
2. Authorize Cloudflare to read `tortireloaded/tango-untitled-site`
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `22` (or 20)
4. Save and deploy. Cloudflare auto-builds on every push to `main`.

First build takes ~1-2 min (npm install + astro build). Subsequent builds under 30s.

### 2. Custom domain (tangountitled.com)

While Squarespace stays your registrar:

1. **Cloudflare Dashboard** → `tango-untitled` Pages project → **Custom domains** → Set up custom domain
2. Add `tangountitled.com` and `www.tangountitled.com`. Cloudflare will give you the exact DNS records to set.
3. **Squarespace Domains** → `tangountitled.com` → DNS settings:
   - Remove any A/CNAME records pointing to Squarespace's web servers
   - Add the A/CNAME records Cloudflare gave you for the root domain and `www`
4. Wait for Cloudflare to provision the TLS cert (5-15 min after DNS resolves).
5. Enable "Enforce HTTPS" once the cert is live.

### 3. (Optional) Direct upload deploys via Wrangler

If you want to deploy without GitHub (e.g. for a quick preview), use the included script:

```bash
export CF_API_TOKEN=***export CF_ACCOUNT_ID=xxxxx
./scripts/deploy.sh
```

You'll need:
- An API token with Pages:Edit permission from https://dash.cloudflare.com/profile/api-tokens
- Your Account ID from the top-right of any Cloudflare dashboard page

## DNS — final state

```
A      tangountitled.com         <Cloudflare IP>
CNAME  www                       tango-untitled.pages.dev.
```

Cloudflare gives you exact values during setup. After 24-48h DNS propagation, the new site is live.

## Once the new site is verified live (give it 7 days)

Cancel the Squarespace **website** subscription (~$16-30/mo):
- `Settings → Billing → Websites → Cancel subscription`
- This kills the Squarespace editor and any web hosting; your domain registration continues unchanged
- Squarespace keeps renewals cheap; later you can move the domain itself to Cloudflare Registrar (free at-cost)

## Future improvements (optional)

- Replace IG iframes with a curated grid pulling from the Instagram Graph API
- Add a per-class weekly schedule grid (markdown → page)
- Replace Acuity link with embedded booking widget
- Add `/sitemap-news.xml` if you start a blog
- Add Webmention support if you syndicate content

## Asset provenance

All images are scraped from the original Squarespace site
(https://www.tangountitled.com). They live under `src/assets/images/`. The
repo can rebuild from these. If you need to add new images, drop them in the
same folder and reference via `import name from "../assets/images/foo.jpg"`.

