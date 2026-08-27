// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static site, Cloudflare Pages-compatible output.
// Add adapters only if we want server-rendered routes later.
//
// `site` and `base` are overridable via env vars so the same source can deploy to:
//   - GitHub Pages (project subpath):  ASTRO_SITE=https://tortireloaded.github.io  ASTRO_BASE=/tango-untitled-site
//   - Cloudflare Pages (root domain):  ASTRO_SITE=https://www.tangountitled.com  ASTRO_BASE=/
export default defineConfig({
  site: process.env.ASTRO_SITE ?? 'https://www.tangountitled.com',
  base: process.env.ASTRO_BASE ?? '/',
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
  },
});
