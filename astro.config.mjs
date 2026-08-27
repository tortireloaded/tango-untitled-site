// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static site, Cloudflare Pages-compatible output.
// Add adapters only if we want server-rendered routes later.
export default defineConfig({
  site: 'https://www.tangountitled.com',
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
