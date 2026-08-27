# Tango Untitled — Site

Static rebuild of tangountitled.com. Astro 7, deploys to Cloudflare Pages.

## Local development

```bash
bun install
bun run dev          # http://localhost:4321
bun run build        # static output to ./dist
bun run preview      # serve ./dist to test the production build
```

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
  favicons/favicon.ico
  robots.txt
```

## Deployment (Cloudflare Pages via direct upload)

### 1. Create the Pages project (one-time)

1. Go to https://dash.cloudflare.com → Workers & Pages → Create → Pages
2. Choose **"Direct Upload"**, project name `tango-untitled`
3. Skip the Git integration for now
4. Once created, paste the Cloudflare **Account ID** (top-right of dashboard)

### 2. Create an API token (one-time)

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token" → "Edit Cloudflare Pages" template
3. Scope to your account (or specific pages project)
4. Save the token

### 3. Deploy

```bash
export CF_API_TOKEN=***export CF_ACCOUNT_ID=xxxxx  # from step 1
./scripts/deploy.sh
```

Wrangler uploads `./dist/` directly. First deployment creates the preview site
at `tango-untitled.pages.dev`. Custom domain connect happens later.

## DNS — go live with the real domain

When you're ready to point `tangountitled.com` at Cloudflare (while Squarespace
remains the registrar):

1. In **Cloudflare Dashboard** → `tango-untitled` Pages project → **Custom domains**
2. Add `tangountitled.com` (and `www.tangountitled.com`)
3. Cloudflare will tell you which records to set at Squarespace
4. Go to **Squarespace Domains** → `tangountitled.com` → DNS settings
5. Add the records Cloudflare gives you, removing any A/CNAME that point to Squarespace

Use Cloudflare's orange-cloud proxy if you want DDOS protection + CDN caching
on top of Cloudflare Pages.

### Recommended DNS records (final state)

```
A      tangountitled.com         <Cloudflare IP>
CNAME  www                       tango-untitled.pages.dev.
CNAME  _acme-challenge          <Cloudflare verification>
```

Cloudflare gives you exact values during setup. After 24-48h DNS propagation,
the new site is live.

## Once the new site is verified live (give it 7 days)

Cancel the Squarespace website subscription (`Settings → Billing`):
- The **website** plan (~$16-30/mo) can be cancelled, you'll lose the Squarespace editor
- The **domain** registration (~$20/yr) should stay so DNS continues to work
- Squarespace keeps renewals cheap; later you can move the domain itself to Cloudflare (step 6.1 below)

## Future improvements (optional)

- Replace IG iframes with a curated grid pulling from the Instagram Graph API
- Add a per-class weekly schedule grid (markdown → page)
- Replace Acuity link with embedded booking widget
- Add `/sitemap-news.xml` if you start a blog
- Add Webmention support if you syndicate content

## Asset provenance

All images are scraped from the existing Squarespace site
(https://www.tangountitled.com). They live under `src/assets/images/`. The
repo can rebuild from these. If you need to add new images, drop them in the
same folder and reference via `import name from "../assets/images/foo.jpg"`.
